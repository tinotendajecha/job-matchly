// lib/jobs/share.ts
//
// Helpers for the public share pages. Kept out of the page files so the
// absolute-URL rule lives in one place — a share link with the wrong host is
// worse than no share link.
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { MarketCode } from '@prisma/client';

/**
 * Base URL for links that leave the app.
 *
 * A share link is pasted into WhatsApp and lives longer than the session that
 * made it, so it can never be relative and never point at a preview
 * deployment. Market decides the domain: a Zimbabwean job shared from the ZW
 * site should keep sending people there.
 */
export function shareBaseUrl(market?: MarketCode | null): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  return market === 'ZA' ? 'https://jobmatchly.co.za' : 'https://www.jobmatchly.site';
}

export function shareUrlFor(jobId: string, market?: MarketCode | null): string {
  return `${shareBaseUrl(market)}/jobs/${jobId}`;
}

/**
 * Records a share-funnel event. Deliberately swallows its own errors: losing a
 * metric must never break the page a real person is trying to read.
 */
export async function trackShareEvent(
  jobId: string,
  kind: 'SHARED' | 'VIEWED' | 'SIGNUP',
  opts: {
    userId?: string | null;
    visitorId?: string | null;
    referrerHost?: string | null;
  } = {}
): Promise<void> {
  try {
    await prisma.jobShareEvent.create({
      data: {
        jobId,
        kind,
        userId: opts.userId ?? null,
        visitorId: opts.visitorId ?? null,
        referrerHost: opts.referrerHost ?? null,
      },
    });
  } catch (err) {
    console.error('share event not recorded', err);
  }
}

/** Host only, so a referrer never carries a path or query into our logs. */
export function referrerHostOf(referer: string | null | undefined): string | null {
  if (!referer) return null;
  try {
    const host = new URL(referer).host.toLowerCase();
    // Our own pages linking to each other aren't acquisition.
    if (host.includes('jobmatchly')) return null;
    return host.slice(0, 128);
  } catch {
    return null;
  }
}

/**
 * Attributes a new account to the job that brought them, if any.
 *
 * Reads the jm_arrival cookie the public job page set. Without this the SIGNUP
 * leg of the funnel is always zero, which reads as "sharing brings nobody in"
 * rather than "we never measured it".
 */
export async function recordArrivalSignup(userId: string): Promise<void> {
  try {
    const raw = cookies().get('jm_arrival')?.value;
    if (!raw) return;
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed?.jobId !== 'string' || !parsed.jobId) return;
    await trackShareEvent(parsed.jobId, 'SIGNUP', {
      userId,
      visitorId: cookies().get('jm_vid')?.value ?? null,
    });
  } catch (err) {
    console.error('arrival signup not attributed', err);
  }
}

/** Trims a scraped description down to something that reads as a summary. */
export function summarize(description: string, max = 320): string {
  const clean = description
    .replace(/\s+/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
  if (clean.length <= max) return clean;
  // Cut at a sentence end where possible, so the preview doesn't stop mid-word.
  const slice = clean.slice(0, max);
  const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '));
  if (lastStop > max * 0.5) return slice.slice(0, lastStop + 1);
  return `${slice.slice(0, slice.lastIndexOf(' '))}…`;
}
