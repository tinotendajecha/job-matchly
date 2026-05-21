import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getUserSubscription, isSubscriptionActive, getUsageSummary } from '@/lib/subscription/service';
import { PLAN_LIMITS } from '@/lib/pricing/plans';

export const runtime = 'nodejs';

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  try {
    const sub = await getUserSubscription(user.id);
    const active = sub ? isSubscriptionActive(sub) : false;
    const usage = active && sub ? await getUsageSummary(user.id) : null;
    const limits = sub ? PLAN_LIMITS[sub.tier] : null;

    return NextResponse.json({
      ok: true,
      subscription: sub
        ? {
            tier: sub.tier,
            status: sub.status,
            billingCycle: sub.billingCycle,
            market: sub.market,
            trialEndsAt: sub.trialEndsAt,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            isActive: active,
          }
        : null,
      usage: usage
        ? {
            tailor: { count: usage.tailorCount, limit: limits?.tailorsPerMonth ?? null },
            download: { count: usage.downloadCount, limit: limits?.downloadsPerMonth ?? null },
            cover_letter: { count: usage.coverLetterCount, limit: limits?.coverLettersPerMonth ?? null },
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Failed to fetch status' }, { status: 500 });
  }
}
