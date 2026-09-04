import { NextResponse } from 'next/server';
import {
  getEffectiveTier,
  isSuperUser,
  checkUsageLimit,
  incrementUsage,
  type UsageAction,
} from './service';
import { PLAN_LIMITS, FREE_TAILOR_LIFETIME_LIMIT } from '@/lib/pricing/plans';
import { prisma } from '@/lib/prisma';
import type { SubscriptionTier } from '@prisma/client';

export class SubscriptionGateError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number,
    public readonly payload: Record<string, unknown>,
  ) {
    super(code);
  }

  toResponse(): NextResponse {
    return NextResponse.json({ ok: false, ...this.payload }, { status: this.httpStatus });
  }
}

export async function requireSubscription(userId: string): Promise<SubscriptionTier> {
  // Resolves to PLUS for admins; otherwise the real active subscription.
  const tier = await getEffectiveTier(userId);
  if (!tier) {
    // A trial can only ever be started once, so telling someone who has already
    // used theirs to "start a free trial" sends them to a button that will
    // refuse them. Six accounts are in exactly that position today.
    const hadSubscriptionBefore = await prisma.subscription.findUnique({
      where: { userId },
      select: { id: true },
    });

    throw new SubscriptionGateError('NO_SUBSCRIPTION', 402, {
      code: 'NO_SUBSCRIPTION',
      message: hadSubscriptionBefore
        ? 'Your plan has ended. Subscribe to continue.'
        : 'Start a free trial to continue.',
      trialAvailable: !hadSubscriptionBefore,
      redirectTo: '/pricing',
    });
  }
  return tier;
}

export async function requireFeatureAccess(
  userId: string,
  feature: 'docx',
): Promise<void> {
  const tier = await requireSubscription(userId);
  const limits = PLAN_LIMITS[tier];

  if (feature === 'docx' && !limits.docxDownloads) {
    throw new SubscriptionGateError('UPGRADE_REQUIRED', 402, {
      code: 'UPGRADE_REQUIRED',
      message: 'DOCX downloads are available on Pro and Plus plans.',
      requiredTier: 'PRO',
      redirectTo: '/pricing',
    });
  }
}

export async function requireAndConsumeUsage(
  userId: string,
  action: UsageAction,
): Promise<SubscriptionTier> {
  const tier = await requireSubscription(userId);

  // Admins have unlimited quota, so metering them would only fill
  // SubscriptionUsage with rows that can never gate anything.
  if (await isSuperUser(userId)) return tier;

  const { allowed, count, limit, resetDate } = await checkUsageLimit(userId, action, tier);

  if (!allowed) {
    const actionLabel: Record<UsageAction, string> = {
      tailor: 'tailors',
      download: 'downloads',
      cover_letter: 'cover letters',
    };
    throw new SubscriptionGateError('LIMIT_REACHED', 402, {
      code: 'LIMIT_REACHED',
      message: `You've used all ${limit} ${actionLabel[action]} this month.`,
      action,
      count,
      limit,
      resetDate: resetDate.toISOString(),
      currentTier: tier,
      requiredTier: tier === 'STARTER' ? 'PRO' : 'PLUS',
      redirectTo: '/pricing',
    });
  }

  await incrementUsage(userId, action);
  return tier;
}

export interface TailorGrant {
  /** Null when the tailor is being paid for out of the free allowance. */
  tier: SubscriptionTier | null;
  usedFreeAllowance: boolean;
}

/**
 * Gates a tailor, allowing one free run before a subscription is needed.
 *
 * Tailoring calls the most expensive model in the stack and was previously
 * ungated entirely: the route read the subscription and then never branched on
 * it, so 251 generations had run against zero active subscriptions.
 *
 * Subscribers keep their normal metered quota. Everyone else gets
 * FREE_TAILOR_LIFETIME_LIMIT, claimed atomically here so two concurrent
 * requests cannot both spend the last one. A caller that fails to generate must
 * call releaseFreeTailor() so a server error doesn't cost someone their only go.
 */
export async function requireTailorAccess(userId: string): Promise<TailorGrant> {
  const tier = await getEffectiveTier(userId);

  // Subscribers, trialists and admins go through the existing metered path.
  if (tier) {
    await requireAndConsumeUsage(userId, 'tailor');
    return { tier, usedFreeAllowance: false };
  }

  // Conditional update, so the check and the spend are one operation.
  const claimed = await prisma.user.updateMany({
    where: { id: userId, freeTailorsUsed: { lt: FREE_TAILOR_LIFETIME_LIMIT } },
    data: { freeTailorsUsed: { increment: 1 } },
  });

  if (claimed.count === 0) {
    throw new SubscriptionGateError('FREE_LIMIT_REACHED', 402, {
      code: 'FREE_LIMIT_REACHED',
      message:
        FREE_TAILOR_LIFETIME_LIMIT === 1
          ? "You've used your free tailored CV. Subscribe to keep tailoring for every job you apply to."
          : `You've used all ${FREE_TAILOR_LIFETIME_LIMIT} free tailored CVs. Subscribe to keep going.`,
      freeLimit: FREE_TAILOR_LIFETIME_LIMIT,
      requiredTier: 'STARTER',
      redirectTo: '/pricing',
    });
  }

  return { tier: null, usedFreeAllowance: true };
}

/** Refunds a free tailor claimed for a run that then failed. */
export async function releaseFreeTailor(userId: string): Promise<void> {
  try {
    await prisma.user.updateMany({
      where: { id: userId, freeTailorsUsed: { gt: 0 } },
      data: { freeTailorsUsed: { decrement: 1 } },
    });
  } catch (err) {
    console.error('could not release free tailor', err);
  }
}
