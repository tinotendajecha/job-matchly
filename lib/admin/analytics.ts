// lib/admin/analytics.ts
// Shared aggregation helpers for the admin analytics + conversion routes.
//
// Every one of these is a SINGLE groupBy joined in JS. This codebase has
// already been bitten once by per-row queries (documents/analytics used to
// issue 90 sequential counts), so the rule here is: one query per dataset,
// bucket in JS. Never `user.findMany({ include: { documents } })` — Prisma can
// emit that as one query per parent.

import { prisma } from "@/lib/prisma";
import { format, subDays } from "date-fns";

/** userId -> number of documents. Only users with >= 1 document appear. */
export async function getDocCountsByUser(): Promise<Map<string, number>> {
  const rows = await prisma.document.groupBy({ by: ["userId"], _count: true });
  return new Map(rows.map((r) => [r.userId, r._count]));
}

/** userId -> earliest document date. Only users with >= 1 document appear. */
export async function getFirstDocAtByUser(): Promise<Map<string, Date>> {
  const rows = await prisma.document.groupBy({
    by: ["userId"],
    _min: { createdAt: true },
  });
  return new Map(
    rows
      .filter((r) => r._min.createdAt)
      .map((r) => [r.userId, r._min.createdAt as Date])
  );
}

/** Pre-seeded day buckets (oldest first) so gaps render as zero, not as holes. */
export function emptyDayBuckets(days: number): Map<string, string> {
  const buckets = new Map<string, string>(); // dayKey -> display label
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i);
    buckets.set(format(d, "yyyy-MM-dd"), format(d, "MMM dd"));
  }
  return buckets;
}

export function bucketCountsByDay(dates: Date[], days: number): Array<{ date: string; count: number }> {
  const labels = emptyDayBuckets(days);
  const counts = new Map<string, number>();
  labels.forEach((_, key) => counts.set(key, 0));
  for (const d of dates) {
    const key = format(new Date(d), "yyyy-MM-dd");
    if (counts.has(key)) counts.set(key, (counts.get(key) as number) + 1);
  }
  return Array.from(labels.entries()).map(([key, label]) => ({
    date: label,
    count: counts.get(key) ?? 0,
  }));
}

export function bucketDistinctByDay(
  rows: Array<{ key: string; createdAt: Date }>,
  days: number
): Array<{ date: string; count: number }> {
  const labels = emptyDayBuckets(days);
  const sets = new Map<string, Set<string>>();
  labels.forEach((_, k) => sets.set(k, new Set()));
  for (const row of rows) {
    const key = format(new Date(row.createdAt), "yyyy-MM-dd");
    sets.get(key)?.add(row.key);
  }
  return Array.from(labels.entries()).map(([key, label]) => ({
    date: label,
    count: sets.get(key)?.size ?? 0,
  }));
}

export function clampDays(raw: string | null, fallback = 30): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(90, Math.max(1, Math.floor(n)));
}
