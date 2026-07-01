import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getMarketFromRequest } from '@/lib/market/request';
import { getUserSubscription, isSubscriptionActive } from '@/lib/subscription/service';
import { PLAN_PRICES } from '@/lib/pricing/plans';
import { pesePayProvider } from '@/lib/payments/providers/pesepay';
import { prisma } from '@/lib/prisma';
import type { BillingCycle, SubscriptionTier } from '@prisma/client';

export const runtime = 'nodejs';

type Body = {
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  paystackEmail?: string;
};

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Body;
    const { tier, billingCycle } = body;

    if (!['STARTER', 'PRO', 'PLUS'].includes(tier)) {
      return NextResponse.json({ ok: false, error: 'Invalid tier' }, { status: 400 });
    }
    if (!['MONTHLY', 'YEARLY'].includes(billingCycle)) {
      return NextResponse.json({ ok: false, error: 'Invalid billing cycle' }, { status: 400 });
    }

    const sub = await getUserSubscription(user.id);
    if (!sub) {
      return NextResponse.json({ ok: false, error: 'No subscription found. Please start a free trial first.' }, { status: 404 });
    }
    // Allow both active subscriptions (upgrade flow) and expired/canceled ones (subscribe-after-trial flow).

    const market = getMarketFromRequest(req);
    const cycleKey = billingCycle === 'YEARLY' ? 'yearly' : 'monthly';
    const priceData = PLAN_PRICES[tier][market];
    const amountMinor = priceData[cycleKey];
    const currency = priceData.currency;

    const appBase = new URL(req.url).origin;

    if (market === 'ZA') {
      const email = body.paystackEmail || user.email;
      if (!email) {
        return NextResponse.json({ ok: false, error: 'Email required' }, { status: 400 });
      }

      const reference = `upgrade_${user.id}_${Date.now()}`;
      const callbackUrl = `${appBase}/subscribe/success?reference=${reference}&tier=${tier}&cycle=${billingCycle}&mode=upgrade`;

      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amountMinor,
          currency: 'ZAR',
          reference,
          callback_url: callbackUrl,
          metadata: {
            type: 'subscription_upgrade',
            userId: user.id,
            tier,
            billingCycle,
            previousTier: sub.tier,
          },
        }),
      });

      const paystackData = await paystackRes.json();
      if (!paystackRes.ok || !paystackData?.status) {
        throw new Error(paystackData?.message || 'Paystack initialization failed');
      }

      const checkoutUrl = paystackData?.data?.authorization_url;
      if (!checkoutUrl) throw new Error('No checkout URL from Paystack');

      return NextResponse.json({ ok: true, market: 'ZA', checkoutUrl });
    }

    // ZW: Pesepay
    const providerRef = `upgrade_${user.id}_${Date.now()}`;
    const resultUrl = `${appBase}/api/payments/pesepay/subscription-webhook?userId=${user.id}&ref=${providerRef}&mode=upgrade&tier=${tier}&cycle=${billingCycle}`;
    const returnUrl = `${appBase}/subscribe/success?mode=upgrade-zw&tier=${tier}&cycle=${billingCycle}`;

    const result = await pesePayProvider.initialize({
      purchase: {
        id: providerRef,
        userId: user.id,
        provider: 'PESEPAY',
        type: 'SYSTEM_BONUS',
        market: 'ZW',
        amount: amountMinor,
        currency,
        status: 'PENDING',
        providerRef,
        documentId: null,
        fulfilledAt: null,
        meta: null,
        createdAt: new Date(),
      },
      email: user.email || '',
      name: user.name,
      description: `Jobmatchly ${tier} subscription upgrade`,
      returnUrl,
      resultUrl,
    });

    await prisma.subscription.update({
      where: { userId: user.id },
      data: { lastPesepayRef: providerRef },
    });

    return NextResponse.json({ ok: true, market: 'ZW', checkoutUrl: result.checkoutUrl });
  } catch (err: any) {
    console.error('upgrade-payment error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Failed to initiate upgrade payment' }, { status: 500 });
  }
}
