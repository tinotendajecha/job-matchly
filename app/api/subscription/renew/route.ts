import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getUserSubscription } from '@/lib/subscription/service';
import { PLAN_PRICES } from '@/lib/pricing/plans';
import { pesePayProvider } from '@/lib/payments/providers/pesepay';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// ZW-only: manual renewal payment via Pesepay
export async function POST() {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  try {
    const sub = await getUserSubscription(user.id);
    if (!sub) {
      return NextResponse.json({ ok: false, error: 'No subscription found' }, { status: 404 });
    }
    if (sub.market !== 'ZW') {
      return NextResponse.json({ ok: false, error: 'Manual renewal is only for ZW subscriptions' }, { status: 400 });
    }
    if (sub.status === 'ACTIVE' && sub.currentPeriodEnd > new Date()) {
      return NextResponse.json({ ok: false, error: 'Subscription is still active' }, { status: 400 });
    }

    const cycleKey = sub.billingCycle === 'YEARLY' ? 'yearly' : 'monthly';
    const price = PLAN_PRICES[sub.tier].ZW[cycleKey];
    const currency = PLAN_PRICES[sub.tier].ZW.currency;

    const appBase = process.env.APP_BASE_URL;
    if (!appBase) throw new Error('Missing APP_BASE_URL');

    const providerRef = `sub_renew_${user.id}_${Date.now()}`;

    const result = await pesePayProvider.initialize({
      purchase: {
        id: providerRef,
        userId: user.id,
        provider: 'PESEPAY',
        type: 'CREDIT_TOPUP',
        market: 'ZW',
        amount: price,
        currency,
        credits: 0,
        status: 'PENDING',
        providerRef,
        documentId: null,
        fulfilledAt: null,
        meta: null,
        createdAt: new Date(),
      },
      email: user.email || '',
      name: user.name,
      description: `Jobmatchly ${sub.tier} subscription renewal`,
      returnUrl: `${appBase}/app/billing?renewed=1`,
      resultUrl: `${appBase}/api/payments/pesepay/subscription-webhook?userId=${user.id}&ref=${providerRef}`,
    });

    // Store pending renewal reference
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { lastPesepayRef: providerRef },
    });

    return NextResponse.json({ ok: true, checkoutUrl: result.checkoutUrl, providerRef });
  } catch (err: any) {
    console.error('renew error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Renewal failed' }, { status: 500 });
  }
}
