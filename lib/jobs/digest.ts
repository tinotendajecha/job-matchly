// lib/jobs/digest.ts
//
// Weekly personalized job digest. Reuses the broadcast send path wholesale, so
// deliverability work already done (personal style, per-recipient results,
// bad-address filtering) applies here too.

import { prisma } from '@/lib/prisma';
import { isSendableEmail } from '@/lib/admin/userFilter';
import { isSubscriptionActive } from '@/lib/subscription/service';
import { sendJobDigestEmail, type DigestJob } from '@/lib/mail';
import { buildUnsubscribeUrl } from '@/lib/unsubscribeToken';
import { liveJobWhere } from './policy';

const JOBS_PER_DIGEST = 5;
const RECENT_ACTIVITY_DAYS = 30;

export interface DigestRecipient {
  userId: string;
  email: string;
  name: string | null;
  bracket: string;
  reason: 'subscriber' | 'recently-active';
  jobs: DigestJob[];
}

export function digestEnabled(): boolean {
  return process.env.JOB_DIGEST_ENABLED === 'true';
}

/**
 * Everyone who should receive a digest right now.
 *
 * Read-only — safe to call for a dry run. Gated on `jobAlertsOptOut`, NOT
 * `marketingOptOut`: they're separate preferences, so muting announcements
 * doesn't silently kill job alerts too.
 */
export async function getDigestRecipients(): Promise<DigestRecipient[]> {
  const recentCutoff = new Date(Date.now() - RECENT_ACTIVITY_DAYS * 86_400_000);

  const candidates = await prisma.user.findMany({
    where: {
      jobAlertsOptOut: false,
      email: { not: null },
      profession: { isNot: null },
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      profession: { select: { bracket: true } },
      subscription: true,
      sessions: {
        where: { createdAt: { gte: recentCutoff } },
        select: { id: true },
        take: 1,
      },
    },
  });

  const recipients: DigestRecipient[] = [];

  for (const user of candidates) {
    if (!isSendableEmail(user.email)) continue;

    const subscriber = user.subscription ? isSubscriptionActive(user.subscription) : false;
    const recentlyActive = user.sessions.length > 0;
    if (!subscriber && !recentlyActive) continue;

    // Only live jobs, freshest first.
    const matches = await prisma.jobMatch.findMany({
      where: { userId: user.id, job: liveJobWhere() },
      orderBy: [{ score: 'desc' }],
      take: JOBS_PER_DIGEST,
      include: {
        job: {
          select: { title: true, company: true, location: true, url: true, market: true, expiresAt: true },
        },
      },
    });

    // Never send an empty digest.
    if (matches.length === 0) continue;

    recipients.push({
      userId: user.id,
      email: user.email as string,
      name: user.name,
      bracket: user.profession?.bracket ?? 'General',
      reason: subscriber ? 'subscriber' : 'recently-active',
      jobs: matches.map((m) => ({
        title: m.job.title,
        company: m.job.company,
        location: m.job.location,
        url: m.job.url,
        market: m.job.market,
        closesInDays: m.job.expiresAt
          ? Math.ceil((m.job.expiresAt.getTime() - Date.now()) / 86_400_000)
          : null,
      })),
    });
  }

  return recipients;
}

const BROWSE_URL = 'https://www.jobmatchly.site/app/jobs';

export function buildDigestIntro(recipient: DigestRecipient): string {
  const n = recipient.jobs.length;
  return n === 1
    ? `Here's a new ${recipient.bracket} role we thought you'd want to see:`
    : `Here are ${n} new ${recipient.bracket} roles we thought you'd want to see:`;
}

export function buildDigestSubject(recipient: DigestRecipient): string {
  const n = recipient.jobs.length;
  return `${n} new ${recipient.bracket} ${n === 1 ? 'job' : 'jobs'} for you`;
}

function digestPayload(recipient: DigestRecipient) {
  return {
    subject: buildDigestSubject(recipient),
    intro: buildDigestIntro(recipient),
    jobs: recipient.jobs,
    name: recipient.name,
    browseUrl: BROWSE_URL,
    // Job alerts have their own opt-out, separate from announcements.
    unsubscribeUrl: `${buildUnsubscribeUrl(recipient.userId)}&type=jobs`,
  };
}

/** Single send — used for the authorised test to the admin's own address. */
export async function sendTestDigest(to: string, recipient: DigestRecipient) {
  return sendJobDigestEmail({ to, ...digestPayload(recipient) });
}

export interface DigestRunResult {
  enabled: boolean;
  recipients: number;
  sent: number;
  failed: number;
  broadcastId?: string;
}

/**
 * Sends the weekly digest to everyone eligible.
 *
 * Each recipient's body differs, so this sends per recipient rather than as one
 * batch. Recorded as a single EmailBroadcast so digests show up in the existing
 * admin history and per-recipient delivery view with no new UI.
 */
export async function runJobDigest(): Promise<DigestRunResult> {
  if (!digestEnabled()) {
    return { enabled: false, recipients: 0, sent: 0, failed: 0 };
  }

  const recipients = await getDigestRecipients();
  if (recipients.length === 0) {
    return { enabled: true, recipients: 0, sent: 0, failed: 0 };
  }

  const broadcast = await prisma.emailBroadcast.create({
    data: {
      subject: `Weekly job digest (${recipients.length} recipients)`,
      body: 'Personalized per recipient — see EmailDelivery rows.',
      audienceFilter: { type: 'job-digest' },
      recipientCount: recipients.length,
      status: 'SENDING',
      style: 'PERSONAL',
      sentByEmail: 'system@jobmatchly',
    },
  });

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const r = await sendJobDigestEmail({ to: recipient.email, ...digestPayload(recipient) });
    await prisma.emailDelivery.create({
      data: {
        broadcastId: broadcast.id,
        email: recipient.email,
        userId: recipient.userId,
        resendId: r?.resendId,
        accepted: Boolean(r?.accepted),
        error: r?.error,
      },
    });

    if (r?.accepted) {
      sent++;
      await prisma.user.update({
        where: { id: recipient.userId },
        data: { lastJobDigestAt: new Date() },
      });
    } else {
      failed++;
    }
  }

  await prisma.emailBroadcast.update({
    where: { id: broadcast.id },
    data: {
      sentCount: sent,
      failedCount: failed,
      status: sent === 0 ? 'FAILED' : 'COMPLETED',
      completedAt: new Date(),
    },
  });

  return { enabled: true, recipients: recipients.length, sent, failed, broadcastId: broadcast.id };
}
