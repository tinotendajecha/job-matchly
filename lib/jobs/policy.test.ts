import { describe, expect, it } from 'vitest';
import { liveJobWhere, undatedJobCutoff, seenRecentlyCutoff } from './policy';

const NOW = new Date('2026-09-20T12:00:00.000Z');
const DAY = 86_400_000;

describe('undatedJobCutoff / seenRecentlyCutoff', () => {
  it('are computed relative to the given "now"', () => {
    expect(undatedJobCutoff(NOW).getTime()).toBe(NOW.getTime() - 14 * DAY);
    expect(seenRecentlyCutoff(NOW).getTime()).toBe(NOW.getTime() - 3 * DAY);
  });
});

describe('liveJobWhere', () => {
  it('always requires ACTIVE status', () => {
    const where = liveJobWhere(NOW);
    expect(where.status).toBe('ACTIVE');
  });

  it('has one OR arm per lifecycle rule', () => {
    const where = liveJobWhere(NOW) as any;
    expect(where.OR).toEqual([
      { expiresAt: { gt: NOW } },
      { expiresAt: null, postedAt: { gte: undatedJobCutoff(NOW) } },
      { expiresAt: null, postedAt: null, createdAt: { gte: undatedJobCutoff(NOW) } },
      { expiresAt: null, lastSeenAt: { gte: seenRecentlyCutoff(NOW) } },
    ]);
  });

  it('lets a recent lastSeenAt override an old postedAt', () => {
    const where = liveJobWhere(NOW) as any;
    const lastSeenArm = where.OR[3];
    // A job posted a year ago but crawled again yesterday matches this arm
    // regardless of postedAt, which is the whole point of the arm.
    expect(lastSeenArm).not.toHaveProperty('postedAt');
    expect(lastSeenArm.lastSeenAt.gte.getTime()).toBe(NOW.getTime() - 3 * DAY);
  });
});
