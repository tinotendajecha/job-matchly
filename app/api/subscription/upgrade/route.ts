import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getUserSubscription, isSubscriptionActive } from '@/lib/subscription/service';
import { prisma } from '@/lib/prisma';
import type { BillingCycle, SubscriptionTier } from '@prisma/client';

export const runtime = 'nodejs';

type Body = {
  tier: SubscriptionTier;
  billingCycle?: BillingCycle;
};

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  try {
    const { tier, billingCycle } = (await req.json()) as Body;

    if (!['STARTER', 'PRO', 'PLUS'].includes(tier)) {
      return NextResponse.json({ ok: false, error: 'Invalid tier' }, { status: 400 });
    }

    const sub = await getUserSubscription(user.id);
    if (!sub || !isSubscriptionActive(sub)) {
      return NextResponse.json({ ok: false, error: 'No active subscription to upgrade' }, { status: 404 });
    }

    const updated = await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        tier,
        ...(billingCycle ? { billingCycle } : {}),
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      ok: true,
      subscription: { tier: updated.tier, status: updated.status, billingCycle: updated.billingCycle },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Upgrade failed' }, { status: 500 });
  }
}
