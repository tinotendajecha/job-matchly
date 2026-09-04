// lib/jobs/policy.ts
//
// Job lifecycle rules, shared by the ingest cron and the read path so a listing
// can't be hidden by one and shown by the other.

import type { Prisma } from '@prisma/client';

/**
 * How long a listing with NO published closing date stays in the feed.
 * Adzuna doesn't publish one, so without this those jobs never expire and the
 * South African feed slowly fills with vacancies that are already filled.
 */
export const UNDATED_JOB_MAX_AGE_DAYS = 14;

/**
 * How long an expired listing stays EXPIRED before moving to ARCHIVED.
 *
 * Nothing is ever deleted. Both states are invisible to job seekers, so the
 * distinction is purely for us: EXPIRED means recently closed and still worth
 * showing in admin as current churn, ARCHIVED means historical record. The
 * archive is the raw material for market-history analysis — how long roles stay
 * open, which employers are ramping or going quiet — and that history cannot be
 * reconstructed after the fact, so it is kept indefinitely.
 */
export const EXPIRED_JOB_ARCHIVE_DAYS = 60;

/**
 * How recently the source must have carried a listing for us to trust it over
 * the age rule. The jobs crawl runs daily, so three days tolerates a missed or
 * failed run without resurrecting something genuinely gone.
 */
export const SEEN_RECENTLY_DAYS = 3;

export function undatedJobCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - UNDATED_JOB_MAX_AGE_DAYS * 86_400_000);
}

export function seenRecentlyCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - SEEN_RECENTLY_DAYS * 86_400_000);
}

/**
 * A job is shown only if it is ACTIVE and either still within its published
 * closing date, or — when undated — recent enough to be plausibly open.
 *
 * The age check is applied here as well as in the cron so that a job crossing
 * the threshold between nightly runs doesn't linger in the feed.
 */
export function liveJobWhere(now: Date = new Date()): Prisma.JobPostWhereInput {
  const cutoff = undatedJobCutoff(now);
  const seenCutoff = seenRecentlyCutoff(now);
  return {
    status: 'ACTIVE',
    OR: [
      { expiresAt: { gt: now } },
      { expiresAt: null, postedAt: { gte: cutoff } },
      { expiresAt: null, postedAt: null, createdAt: { gte: cutoff } },
      // Observation beats the age rule. The 14-day cutoff is a guess for
      // listings with no closing date; when the source still carried the
      // listing in the last crawl, that guess is simply wrong and was hiding
      // jobs people could still apply to.
      { expiresAt: null, lastSeenAt: { gte: seenCutoff } },
    ],
  };
}
