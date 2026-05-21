import { prisma } from '@/lib/prisma';
import type { BillingCycle, MarketCode, Subscription, SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { addDays, addMonths, addYears, startOfMonth } from 'date-fns';
import { PLAN_LIMITS, TRIAL_DAYS } from '@/lib/pricing/plans';

export type UsageAction = 'tailor' | 'download' | 'cover_letter';

export function getCurrentPeriodStart(): Date {
  return startOfMonth(new Date());
}

export function isSubscriptionActive(sub: Subscription): boolean {
  const now = new Date();
  if (sub.status === 'TRIALING') {
    return sub.trialEndsAt != null && sub.trialEndsAt > now;
  }
  if (sub.status === 'ACTIVE') {
    return sub.currentPeriodEnd > now;
  }
  return false;
}

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findUnique({ where: { userId } });
}

export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const sub = await getUserSubscription(userId);
  if (!sub || !isSubscriptionActive(sub)) return null;
  return sub;
}

export async function getActiveTier(userId: string): Promise<SubscriptionTier | null> {
  const sub = await getActiveSubscription(userId);
  return sub?.tier ?? null;
}

export async function checkUsageLimit(
  userId: string,
  action: UsageAction,
  tier: SubscriptionTier,
): Promise<{ allowed: boolean; count: number; limit: number | null; resetDate: Date }> {
  const limits = PLAN_LIMITS[tier];
  const limitMap: Record<UsageAction, number | null> = {
    tailor: limits.tailorsPerMonth,
    download: limits.downloadsPerMonth,
    cover_letter: limits.coverLettersPerMonth,
  };
  const limit = limitMap[action];
  const resetDate = addMonths(getCurrentPeriodStart(), 1);

  if (limit === null) {
    return { allowed: true, count: 0, limit: null, resetDate };
  }

  const periodStart = getCurrentPeriodStart();
  const usage = await prisma.subscriptionUsage.findUnique({
    where: { userId_periodStart: { userId, periodStart } },
  });

  const countMap: Record<UsageAction, number> = {
    tailor: usage?.tailorCount ?? 0,
    download: usage?.downloadCount ?? 0,
    cover_letter: usage?.coverLetterCount ?? 0,
  };
  const count = countMap[action];

  return { allowed: count < limit, count, limit, resetDate };
}

export async function incrementUsage(userId: string, action: UsageAction): Promise<void> {
  const periodStart = getCurrentPeriodStart();
  const field: Record<UsageAction, object> = {
    tailor: { tailorCount: { increment: 1 } },
    download: { downloadCount: { increment: 1 } },
    cover_letter: { coverLetterCount: { increment: 1 } },
  };

  await prisma.subscriptionUsage.upsert({
    where: { userId_periodStart: { userId, periodStart } },
    create: {
      userId,
      periodStart,
      tailorCount: action === 'tailor' ? 1 : 0,
      downloadCount: action === 'download' ? 1 : 0,
      coverLetterCount: action === 'cover_letter' ? 1 : 0,
    },
    update: field[action],
  });
}

export async function startTrialZW(
  userId: string,
  tier: SubscriptionTier,
  billingCycle: BillingCycle,
): Promise<Subscription> {
  const now = new Date();
  const trialEndsAt = addDays(now, TRIAL_DAYS);

  // Zero out legacy credits on first subscription
  await prisma.user.update({ where: { id: userId }, data: { credits: 0 } });

  return prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier,
      status: 'TRIALING',
      billingCycle,
      market: 'ZW',
      trialEndsAt,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
    },
    update: {
      tier,
      status: 'TRIALING',
      billingCycle,
      trialEndsAt,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
  });
}

export async function activateSubscriptionFromPaystack(input: {
  userId: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  paystackAuthCode: string;
  paystackCustomerCode: string;
  paystackSubscriptionCode: string;
  paystackEmailToken: string | null;
  paystackRef: string;
}): Promise<Subscription> {
  const now = new Date();
  const trialEndsAt = addDays(now, TRIAL_DAYS);

  // Zero out legacy credits on first subscription
  await prisma.user.update({ where: { id: input.userId }, data: { credits: 0 } });

  return prisma.subscription.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      tier: input.tier,
      status: 'TRIALING',
      billingCycle: input.billingCycle,
      market: 'ZA',
      trialEndsAt,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
      paystackAuthCode: input.paystackAuthCode,
      paystackCustomerCode: input.paystackCustomerCode,
      paystackSubscriptionCode: input.paystackSubscriptionCode,
      paystackEmailToken: input.paystackEmailToken ?? null,
      lastPesepayRef: null,
    },
    update: {
      tier: input.tier,
      status: 'TRIALING',
      billingCycle: input.billingCycle,
      trialEndsAt,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
      paystackAuthCode: input.paystackAuthCode,
      paystackCustomerCode: input.paystackCustomerCode,
      paystackSubscriptionCode: input.paystackSubscriptionCode,
      paystackEmailToken: input.paystackEmailToken ?? null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
  });
}

export function getNextPeriodEnd(from: Date, cycle: BillingCycle): Date {
  return cycle === 'YEARLY' ? addYears(from, 1) : addMonths(from, 1);
}

export async function extendSubscriptionPeriod(
  userId: string,
  newPeriodEnd: Date,
  status: SubscriptionStatus = 'ACTIVE',
): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: { status, currentPeriodEnd: newPeriodEnd, currentPeriodStart: new Date() },
  });
}

export async function cancelSubscription(userId: string): Promise<void> {
  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
  });
}

export async function getUsageSummary(userId: string) {
  const periodStart = getCurrentPeriodStart();
  const usage = await prisma.subscriptionUsage.findUnique({
    where: { userId_periodStart: { userId, periodStart } },
  });
  return {
    tailorCount: usage?.tailorCount ?? 0,
    downloadCount: usage?.downloadCount ?? 0,
    coverLetterCount: usage?.coverLetterCount ?? 0,
  };
}
