// lib/analytics/prune.ts
import { prisma } from "@/lib/prisma";

/**
 * Retention for anonymous page-view telemetry.
 *
 * The prune runs from the weekly cron, so real maximum age is up to ~97 days.
 * Disclose this as "about 90 days" rather than a hard 90.
 */
export const PAGEVIEW_RETENTION_DAYS = 90;

export async function prunePageViews(): Promise<{ deleted: number; cutoff: string }> {
  const cutoff = new Date(Date.now() - PAGEVIEW_RETENTION_DAYS * 86_400_000);
  const { count } = await prisma.pageView.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return { deleted: count, cutoff: cutoff.toISOString() };
}
