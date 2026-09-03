// lib/jobs/share.ts
//
// Helpers for the public share pages. Kept out of the page files so the
// absolute-URL rule lives in one place — a share link with the wrong host is
// worse than no share link.
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
  userId?: string | null
): Promise<void> {
  try {
    await prisma.jobShareEvent.create({ data: { jobId, kind, userId: userId ?? null } });
  } catch (err) {
    console.error('share event not recorded', err);
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
