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

/** Expired listings are invisible to users; keep them briefly, then drop them. */
export const EXPIRED_JOB_RETENTION_DAYS = 60;

export function undatedJobCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - UNDATED_JOB_MAX_AGE_DAYS * 86_400_000);
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
  return {
    status: 'ACTIVE',
    OR: [
      { expiresAt: { gt: now } },
      { expiresAt: null, postedAt: { gte: cutoff } },
      { expiresAt: null, postedAt: null, createdAt: { gte: cutoff } },
    ],
  };
}
