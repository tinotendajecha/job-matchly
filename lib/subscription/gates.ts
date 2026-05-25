import { NextResponse } from 'next/server';
import { getActiveSubscription, checkUsageLimit, incrementUsage, type UsageAction } from './service';
import { PLAN_LIMITS } from '@/lib/pricing/plans';
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
  const sub = await getActiveSubscription(userId);
  if (!sub) {
    throw new SubscriptionGateError('NO_SUBSCRIPTION', 402, {
      code: 'NO_SUBSCRIPTION',
      message: 'Start a free trial to continue.',
      redirectTo: '/pricing',
    });
  }
  return sub.tier;
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
  const { allowed, count, limit, resetDate } = await checkUsageLimit(userId, action, tier);

  if (!allowed) {
    const actionLabel: Record<UsageAction, string> = {
      tailor: 'tailors',
      download: 'downloads',
      cover_letter: 'cover letters',
    };
    throw new SubscriptionGateError('LIMIT_REACHED', 402, {
      code: 'LIMIT_REACHED',
      message: `You've used all ${limit} ${actionLabel[action]} this month. Upgrade for more.`,
      action,
      count,
      limit,
      resetDate: resetDate.toISOString(),
      requiredTier: tier === 'STARTER' ? 'PRO' : 'PLUS',
      redirectTo: '/pricing',
    });
  }

  await incrementUsage(userId, action);
  return tier;
}
