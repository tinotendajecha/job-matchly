import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '../../test/prisma-mock';
import type { Subscription } from '@prisma/client';
import {
  releaseFreeTailor,
  requireAndConsumeUsage,
  requireFeatureAccess,
  requireSubscription,
  requireTailorAccess,
  SubscriptionGateError,
} from './gates';
import { FREE_TAILOR_LIFETIME_LIMIT } from '@/lib/pricing/plans';

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

describe('requireSubscription', () => {
  it('passes through the effective tier when one exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    prismaMock.subscription.findUnique.mockResolvedValue(makeSubscription({ tier: 'PLUS' }));

    expect(await requireSubscription('user_1')).toBe('PLUS');
  });

  it('offers a trial when the user has never subscribed', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    // getEffectiveTier -> getActiveSubscription -> findUnique(null)
    // requireSubscription's own "hadSubscriptionBefore" lookup also returns null
    prismaMock.subscription.findUnique.mockResolvedValue(null);

    const err = await requireSubscription('user_1').catch((e) => e);

    expect(err).toBeInstanceOf(SubscriptionGateError);
    expect(err.payload.trialAvailable).toBe(true);
    expect(err.payload.message).toMatch(/start a free trial/i);
  });

  it('does not offer a trial when a subscription existed but has lapsed', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    prismaMock.subscription.findUnique
      // getActiveSubscription's lookup: expired, so getEffectiveTier resolves null
      .mockResolvedValueOnce(
        makeSubscription({ status: 'EXPIRED', currentPeriodEnd: new Date(NOW.getTime() - 1000) }),
      )
      // requireSubscription's own existence check: a row exists
      .mockResolvedValueOnce({ id: 'sub_1' } as any);

    const err = await requireSubscription('user_1').catch((e) => e);

    expect(err).toBeInstanceOf(SubscriptionGateError);
    expect(err.payload.trialAvailable).toBe(false);
    expect(err.payload.message).toMatch(/plan has ended/i);
  });
});

describe('requireFeatureAccess', () => {
  it('rejects docx downloads on STARTER', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    prismaMock.subscription.findUnique.mockResolvedValue(makeSubscription({ tier: 'STARTER' }));

    const err = await requireFeatureAccess('user_1', 'docx').catch((e) => e);

    expect(err).toBeInstanceOf(SubscriptionGateError);
    expect(err.code).toBe('UPGRADE_REQUIRED');
  });

  it('allows docx downloads on PRO', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    prismaMock.subscription.findUnique.mockResolvedValue(makeSubscription({ tier: 'PRO' }));

    await expect(requireFeatureAccess('user_1', 'docx')).resolves.toBeUndefined();
  });
});

describe('requireAndConsumeUsage', () => {
  it('does not meter admins: skips checkUsageLimit and incrementUsage entirely', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: true } as any);

    const tier = await requireAndConsumeUsage('admin_1', 'tailor');

    expect(tier).toBe('PLUS');
    expect(prismaMock.subscriptionUsage.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.subscriptionUsage.upsert).not.toHaveBeenCalled();
  });

  it('consumes usage and returns the tier when under the limit', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    prismaMock.subscription.findUnique.mockResolvedValue(makeSubscription({ tier: 'STARTER' }));
    prismaMock.subscriptionUsage.findUnique.mockResolvedValue({ tailorCount: 1 } as any);

    const tier = await requireAndConsumeUsage('user_1', 'tailor');

    expect(tier).toBe('STARTER');
    expect(prismaMock.subscriptionUsage.upsert).toHaveBeenCalled();
  });

  it('throws LIMIT_REACHED with the next tier up as requiredTier, for STARTER and PRO', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);

    prismaMock.subscription.findUnique.mockResolvedValue(makeSubscription({ tier: 'STARTER' }));
    prismaMock.subscriptionUsage.findUnique.mockResolvedValue({ tailorCount: 5 } as any);
    const starterErr = await requireAndConsumeUsage('user_1', 'tailor').catch((e) => e);
    expect(starterErr.payload.requiredTier).toBe('PRO');

    prismaMock.subscription.findUnique.mockResolvedValue(makeSubscription({ tier: 'PRO' }));
    prismaMock.subscriptionUsage.findUnique.mockResolvedValue({ tailorCount: 20 } as any);
    const proErr = await requireAndConsumeUsage('user_1', 'tailor').catch((e) => e);
    expect(proErr.payload.requiredTier).toBe('PLUS');
  });
});

describe('requireTailorAccess', () => {
  it('routes subscribers through the metered path, ignoring the free allowance', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    prismaMock.subscription.findUnique.mockResolvedValue(makeSubscription({ tier: 'PRO' }));
    prismaMock.subscriptionUsage.findUnique.mockResolvedValue({ tailorCount: 0 } as any);

    const grant = await requireTailorAccess('user_1');

    expect(grant).toEqual({ tier: 'PRO', usedFreeAllowance: false });
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it('claims the free tailor atomically for a non-subscriber', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    const grant = await requireTailorAccess('user_1');

    expect(grant).toEqual({ tier: null, usedFreeAllowance: true });
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user_1', freeTailorsUsed: { lt: FREE_TAILOR_LIFETIME_LIMIT } },
      data: { freeTailorsUsed: { increment: 1 } },
    });
  });

  it('throws FREE_LIMIT_REACHED when the atomic claim loses the race (count 0)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isAdmin: false } as any);
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

    const err = await requireTailorAccess('user_1').catch((e) => e);

    expect(err).toBeInstanceOf(SubscriptionGateError);
    expect(err.code).toBe('FREE_LIMIT_REACHED');
  });
});

describe('releaseFreeTailor', () => {
  it('never throws, even if the underlying update rejects', async () => {
    prismaMock.user.updateMany.mockRejectedValue(new Error('db down'));

    await expect(releaseFreeTailor('user_1')).resolves.toBeUndefined();
  });

  it('decrements the free-tailor counter', async () => {
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    await releaseFreeTailor('user_1');

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user_1', freeTailorsUsed: { gt: 0 } },
      data: { freeTailorsUsed: { decrement: 1 } },
    });
  });
});
