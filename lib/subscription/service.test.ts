import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '../../test/prisma-mock';
import type { Subscription } from '@prisma/client';
import {
  checkUsageLimit,
  getEffectiveTier,
  incrementUsage,
  isSubscriptionActive,
  reconcileSubscriptionStatuses,
} from './service';

const NOW = new Date('2026-09-20T12:00:00.000Z');

function makeSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub_1',
    userId: 'user_1',
    tier: 'PRO',
    status: 'ACTIVE',
    billingCycle: 'MONTHLY',
    market: 'ZW',
    trialEndsAt: null,
    currentPeriodStart: new Date('2026-09-01T00:00:00.000Z'),
    currentPeriodEnd: new Date('2026-10-01T00:00:00.000Z'),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    paystackAuthCode: null,
    paystackCustomerCode: null,
    paystackSubscriptionCode: null,
    paystackPlanCode: null,
    paystackEmailToken: null,
    lastPesepayRef: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as Subscription;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('isSubscriptionActive', () => {
  it('is active while trialing and the trial has not ended', () => {
    const sub = makeSubscription({ status: 'TRIALING', trialEndsAt: new Date(NOW.getTime() + 1000) });
    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it('is inactive once the trial end date has passed', () => {
    const sub = makeSubscription({ status: 'TRIALING', trialEndsAt: new Date(NOW.getTime() - 1000) });
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('is inactive when trialing with no trialEndsAt set', () => {
    const sub = makeSubscription({ status: 'TRIALING', trialEndsAt: null });
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('is active while ACTIVE and within the current period', () => {
    const sub = makeSubscription({ status: 'ACTIVE', currentPeriodEnd: new Date(NOW.getTime() + 1000) });
    expect(isSubscriptionActive(sub)).toBe(true);
  });

  it('is inactive once the current period has ended', () => {
    const sub = makeSubscription({ status: 'ACTIVE', currentPeriodEnd: new Date(NOW.getTime() - 1000) });
    expect(isSubscriptionActive(sub)).toBe(false);
  });

  it('is inactive for any other status', () => {
    expect(isSubscriptionActive(makeSubscription({ status: 'PAST_DUE' }))).toBe(false);
    expect(isSubscriptionActive(makeSubscription({ status: 'CANCELED' }))).toBe(false);
    expect(isSubscriptionActive(makeSubscription({ status: 'EXPIRED' }))).toBe(false);
  });
});

describe('getEffectiveTier', () => {
  it('grants PLUS to admins even with no subscription row at all', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: true } as any);
    prismaMock.subscription.findUnique.mockResolvedValue(null);

    const tier = await getEffectiveTier('admin_1');

    expect(tier).toBe('PLUS');
    expect(prismaMock.subscription.findUnique).not.toHaveBeenCalled();
  });

  it('returns the real tier for a non-admin with an active subscription', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    prismaMock.subscription.findUnique.mockResolvedValue(makeSubscription({ tier: 'STARTER' }));

    expect(await getEffectiveTier('user_1')).toBe('STARTER');
  });

  it('returns null for a non-admin with no active subscription', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    prismaMock.subscription.findUnique.mockResolvedValue(
      makeSubscription({ status: 'EXPIRED', currentPeriodEnd: new Date(NOW.getTime() - 1000) }),
    );

    expect(await getEffectiveTier('user_1')).toBeNull();
  });
});

describe('checkUsageLimit', () => {
  it('never queries usage for an unlimited (PLUS) limit', async () => {
    const result = await checkUsageLimit('user_1', 'tailor', 'PLUS');

    expect(result).toEqual(expect.objectContaining({ allowed: true, limit: null }));
    expect(prismaMock.subscriptionUsage.findUnique).not.toHaveBeenCalled();
  });

  it('treats a missing usage row as zero usage', async () => {
    prismaMock.subscriptionUsage.findUnique.mockResolvedValue(null);

    const result = await checkUsageLimit('user_1', 'tailor', 'STARTER');

    expect(result.count).toBe(0);
    expect(result.allowed).toBe(true);
  });

  it('disallows once the count reaches the plan limit', async () => {
    prismaMock.subscriptionUsage.findUnique.mockResolvedValue({ tailorCount: 5 } as any);

    const result = await checkUsageLimit('user_1', 'tailor', 'STARTER');

    expect(result).toEqual(expect.objectContaining({ allowed: false, count: 5, limit: 5 }));
  });
});

describe('incrementUsage', () => {
  it('upserts with only the touched counter set to 1 on create', async () => {
    await incrementUsage('user_1', 'download');

    expect(prismaMock.subscriptionUsage.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ tailorCount: 0, downloadCount: 1, coverLetterCount: 0 }),
        update: { downloadCount: { increment: 1 } },
      }),
    );
  });
});

describe('reconcileSubscriptionStatuses', () => {
  it('splits lapsed ACTIVE subscriptions by cancelAtPeriodEnd', async () => {
    prismaMock.subscription.updateMany
      .mockResolvedValueOnce({ count: 2 }) // trialsExpired
      .mockResolvedValueOnce({ count: 1 }) // canceledExpired
      .mockResolvedValueOnce({ count: 3 }); // lapsedToPastDue

    const result = await reconcileSubscriptionStatuses();

    expect(result).toEqual({ trialsExpired: 2, canceledExpired: 1, lapsedToPastDue: 3 });

    const calls = prismaMock.subscription.updateMany.mock.calls;
    expect(calls[1][0]).toEqual(
      expect.objectContaining({
        where: expect.objectContaining({ cancelAtPeriodEnd: true }),
        data: { status: 'EXPIRED' },
      }),
    );
    expect(calls[2][0]).toEqual(
      expect.objectContaining({
        where: expect.objectContaining({ cancelAtPeriodEnd: false }),
        data: { status: 'PAST_DUE' },
      }),
    );
  });
});
