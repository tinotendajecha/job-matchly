import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getNextPeriodEnd } from '@/lib/subscription/service';
import { prisma } from '@/lib/prisma';
import type { BillingCycle, SubscriptionTier } from '@prisma/client';

export const runtime = 'nodejs';

type Body = {
  reference: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
};

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  try {
    const { reference, tier, billingCycle } = (await req.json()) as Body;

    if (!reference || !tier || !billingCycle) {
      return NextResponse.json({ ok: false, error: 'Missing reference, tier, or billingCycle' }, { status: 400 });
    }

    // Verify the Paystack transaction
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } },
    );
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData?.status) {
      throw new Error(verifyData?.message || 'Paystack verification failed');
    }

    const txData = verifyData?.data;
    if (String(txData?.status || '').toLowerCase() !== 'success') {
      throw new Error('Payment not successful');
    }

    // Upgrade: change tier, activate (end trial), extend period
    const now = new Date();
    const periodEnd = getNextPeriodEnd(now, billingCycle);

    const updated = await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        tier,
        billingCycle,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    });

    return NextResponse.json({
      ok: true,
      subscription: { tier: updated.tier, status: updated.status, currentPeriodEnd: updated.currentPeriodEnd },
    });
  } catch (err: any) {
    console.error('verify-upgrade error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Upgrade verification failed' }, { status: 500 });
  }
}
