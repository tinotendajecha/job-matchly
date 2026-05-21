import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getMarketFromRequest } from '@/lib/market/request';
import { startTrialZW } from '@/lib/subscription/service';
import { PLAN_PRICES, PAYSTACK_TOKENIZE_AMOUNT_MINOR, TRIAL_DAYS } from '@/lib/pricing/plans';
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

    // Check for existing active subscription
    const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
    if (existing && (existing.status === 'TRIALING' || existing.status === 'ACTIVE')) {
      return NextResponse.json({ ok: false, error: 'Already subscribed' }, { status: 409 });
    }

    const market = getMarketFromRequest(req);

    if (market === 'ZW') {
      const sub = await startTrialZW(user.id, tier, billingCycle);
      return NextResponse.json({ ok: true, market: 'ZW', subscription: { tier: sub.tier, status: sub.status, trialEndsAt: sub.trialEndsAt } });
    }

    // ZA: initiate R1 Paystack tokenization charge
    const email = body.paystackEmail || user.email;
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Email required for ZA trial' }, { status: 400 });
    }

    const appBase = process.env.APP_BASE_URL;
    if (!appBase) throw new Error('Missing APP_BASE_URL');

    const reference = `trial_tok_${user.id}_${Date.now()}`;
    const callbackUrl = `${appBase}/subscribe/success?reference=${reference}&tier=${tier}&cycle=${billingCycle}`;

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: PAYSTACK_TOKENIZE_AMOUNT_MINOR,
        currency: 'ZAR',
        reference,
        callback_url: callbackUrl,
        metadata: {
          type: 'trial_tokenize',
          userId: user.id,
          tier,
          billingCycle,
          trialDays: TRIAL_DAYS,
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
  } catch (err: any) {
    console.error('start-trial error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Failed to start trial' }, { status: 500 });
  }
}
