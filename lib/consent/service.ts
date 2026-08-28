// lib/consent/service.ts
//
// One place to record and read consent, so the audit trail and the flags the
// app actually queries can never drift apart.
import type { ConsentPurpose, MarketCode, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Current policy version per market.
 *
 * v2 narrows recruiter sharing from a blanket authorisation granted by signing
 * up to a separate opt-in, so it is a substantive change rather than a
 * re-issue. Users who accepted v1 keep a v1 record: we must not silently treat
 * an old agreement as acceptance of a new one.
 */
export const CONSENT_VERSIONS: Record<MarketCode, string> = {
  ZA: 'ZA-2026-v2',
  ZW: 'ZW-2026-v2',
};

export function consentVersionFor(market: MarketCode | null | undefined): string {
  return CONSENT_VERSIONS[market ?? 'ZW'] ?? CONSENT_VERSIONS.ZW;
}

/** Where a consent action originated, for the audit trail. */
export type ConsentSource =
  | 'signup'
  | 'profile'
  | 'onboarding'
  | 'unsubscribe-link'
  | 'admin'
  | 'backfill';

interface RecordArgs {
  userId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  version: string;
  source: ConsentSource;
  /** Runs inside a caller's transaction when the flag write must be atomic with the log. */
  tx?: Prisma.TransactionClient;
}

/**
 * Appends one consent event. Never updates or deletes — a withdrawal is a new
 * row with granted = false, which is what makes the history provable.
 */
export async function recordConsent({
  userId,
  purpose,
  granted,
  version,
  source,
  tx,
}: RecordArgs) {
  const db = tx ?? prisma;
  return db.consentRecord.create({
    data: { userId, purpose, granted, version, source },
  });
}

/**
 * Sets recruiter discoverability and logs it atomically.
 *
 * The flag and the log are written in one transaction because a flag without a
 * record is unprovable, and a record without a flag means we told the user
 * something we didn't do.
 */
export async function setRecruiterVisibility(opts: {
  userId: string;
  granted: boolean;
  version: string;
  source: ConsentSource;
}) {
  const { userId, granted, version, source } = opts;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        recruiterVisible: granted,
        // Kept on withdrawal: it records when they first agreed, and the ledger
        // carries the withdrawal itself.
        ...(granted ? { recruiterVisibleAt: new Date() } : {}),
      },
      select: { id: true, recruiterVisible: true, recruiterVisibleAt: true },
    });

    await recordConsent({
      userId,
      purpose: 'RECRUITER_VISIBILITY',
      granted,
      version,
      source,
      tx,
    });

    return user;
  });
}

/** Latest event per purpose for one user, for the profile UI and for audits. */
export async function getConsentHistory(userId: string) {
  return prisma.consentRecord.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      purpose: true,
      granted: true,
      version: true,
      source: true,
      createdAt: true,
    },
  });
}

/**
 * Users who may be shown to recruiters.
 *
 * Deliberately the only supported way to build that audience. Querying
 * recruiterVisible directly would work today and would quietly stop being
 * correct the moment another condition is added.
 */
export function recruiterVisibleWhere(): Prisma.UserWhereInput {
  return {
    recruiterVisible: true,
    // A withdrawn or deleted account must never surface, however stale a
    // recruiter's saved search is.
    email: { not: null },
  };
}

export async function countRecruiterVisible(): Promise<number> {
  return prisma.user.count({ where: recruiterVisibleWhere() });
}
