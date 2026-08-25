// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { requireAdmin } from "../middleware";
import {
  getDocCountsByUser,
  getFirstDocAtByUser,
  bucketCountsByDay,
  bucketDistinctByDay,
  clampDays,
} from "@/lib/admin/analytics";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const days = clampDays(new URL(request.url).searchParams.get("days"));
    const windowStart = subDays(new Date(), days);
    const thirtyDaysAgo = subDays(new Date(), 30);
    const pvWhere = { createdAt: { gte: windowStart } };

    const [
      usersBeforeWindow,
      usersInWindow,
      docsByKindAll,
      docsByKindWindow,
      docCounts,
      firstDocAt,
      allUsers,
      sessions,
      pvByDay,
      pvByDayVisitor,
      pvByPath,
      pvByReferrer,
      pvByDevice,
      pvByCountry,
      pvOldest,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { lt: windowStart } } }),
      prisma.user.findMany({ where: { createdAt: { gte: windowStart } }, select: { createdAt: true } }),
      prisma.document.groupBy({ by: ["kind"], _count: true }),
      prisma.document.groupBy({ by: ["kind"], where: { createdAt: { gte: windowStart } }, _count: true }),
      getDocCountsByUser(),
      getFirstDocAtByUser(),
      prisma.user.findMany({ select: { id: true, createdAt: true } }),
      prisma.session.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { userId: true, createdAt: true },
      }),
      prisma.pageView.groupBy({ by: ["dayKey"], where: pvWhere, _count: true }),
      prisma.pageView.groupBy({ by: ["dayKey", "visitorId"], where: pvWhere, _count: true }),
      prisma.pageView.groupBy({ by: ["path"], where: pvWhere, _count: true }),
      prisma.pageView.groupBy({ by: ["referrerHost"], where: pvWhere, _count: true }),
      prisma.pageView.groupBy({ by: ["device"], where: pvWhere, _count: true }),
      prisma.pageView.groupBy({ by: ["country"], where: pvWhere, _count: true }),
      prisma.pageView.aggregate({ _min: { createdAt: true } }),
    ]);

    // --- Growth -------------------------------------------------------------
    const dailySignups = bucketCountsByDay(usersInWindow.map((u) => u.createdAt), days);
    let running = usersBeforeWindow;
    const cumulativeUsers = dailySignups.map((d) => {
      running += d.count;
      return { date: d.date, users: running };
    });

    const prettyKind = (k: string) =>
      k.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

    // --- Engagement ---------------------------------------------------------
    const totalUsers = allUsers.length;
    const buckets = { "0 docs": totalUsers - docCounts.size, "1-3": 0, "4-10": 0, "10+": 0 };
    docCounts.forEach((count) => {
      if (count <= 3) buckets["1-3"]++;
      else if (count <= 10) buckets["4-10"]++;
      else buckets["10+"]++;
    });
    const docsPerUser = Object.entries(buckets).map(([range, count]) => ({ range, count }));

    const createdAtById = new Map(allUsers.map((u) => [u.id, u.createdAt]));
    const hoursToFirst: number[] = [];
    firstDocAt.forEach((firstAt, userId) => {
      const created = createdAtById.get(userId);
      if (!created) return;
      // max(0) guards documents backfilled ahead of their user row.
      hoursToFirst.push(Math.max(0, (firstAt.getTime() - created.getTime()) / 3_600_000));
    });
    const ttfBuckets = { "< 1 hour": 0, "1-24 hours": 0, "1-3 days": 0, "3-7 days": 0, "> 7 days": 0 };
    hoursToFirst.forEach((h) => {
      if (h < 1) ttfBuckets["< 1 hour"]++;
      else if (h < 24) ttfBuckets["1-24 hours"]++;
      else if (h < 72) ttfBuckets["1-3 days"]++;
      else if (h < 168) ttfBuckets["3-7 days"]++;
      else ttfBuckets["> 7 days"]++;
    });

    // --- Activity (login-based proxy) ---------------------------------------
    const distinctSince = (from: Date) =>
      new Set(sessions.filter((s) => s.createdAt >= from).map((s) => s.userId)).size;
    const dailyActive = bucketDistinctByDay(
      sessions.map((s) => ({ key: s.userId, createdAt: s.createdAt })),
      Math.min(days, 30)
    );

    // --- Traffic ------------------------------------------------------------
    const viewCountsByDay = new Map(pvByDay.map((r) => [r.dayKey, r._count]));
    const viewsByDay = bucketDayKeys(days).map(({ key, label }) => ({
      date: label,
      count: viewCountsByDay.get(key) ?? 0,
    }));

    const uniquesPerDay = new Map<string, number>();
    pvByDayVisitor.forEach((r) => uniquesPerDay.set(r.dayKey, (uniquesPerDay.get(r.dayKey) ?? 0) + 1));
    const uniqueByDay = bucketDayKeys(days).map(({ key, label }) => ({
      date: label,
      count: uniquesPerDay.get(key) ?? 0,
    }));

    const uniqueVisitors = new Set(pvByDayVisitor.map((r) => r.visitorId)).size;
    const totalViews = pvByDay.reduce((sum, r) => sum + r._count, 0);

    const rank = <T extends { _count: number }>(rows: T[], take: number) =>
      [...rows].sort((a, b) => b._count - a._count).slice(0, take);

    return NextResponse.json({
      ok: true,
      data: {
        growth: { dailySignups, cumulativeUsers, totalUsers },
        engagement: {
          featureUsage: docsByKindAll.map((r) => ({ type: prettyKind(r.kind), count: r._count })),
          featureUsageWindow: docsByKindWindow.map((r) => ({ type: prettyKind(r.kind), count: r._count })),
          docsPerUser,
          timeToFirstDoc: Object.entries(ttfBuckets).map(([range, count]) => ({ range, count })),
          medianHoursToFirstDoc: median(hoursToFirst),
          activatedUsers: hoursToFirst.length,
        },
        activity: {
          dau: distinctSince(subDays(new Date(), 1)),
          wau: distinctSince(subDays(new Date(), 7)),
          mau: distinctSince(thirtyDaysAgo),
          dailyActive,
        },
        traffic: {
          viewsByDay,
          uniqueByDay,
          uniqueVisitors,
          totalViews,
          topPages: rank(pvByPath, 15).map((r) => ({ label: r.path, count: r._count })),
          referrers: rank(pvByReferrer, 10).map((r) => ({ label: r.referrerHost ?? "Direct", count: r._count })),
          devices: rank(pvByDevice, 5).map((r) => ({ label: r.device, count: r._count })),
          countries: rank(pvByCountry, 10).map((r) => ({ label: r.country ?? "Unknown", count: r._count })),
        },
        meta: {
          windowDays: days,
          trackingSince: pvOldest._min.createdAt ? pvOldest._min.createdAt.toISOString() : null,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("admin analytics error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load analytics" }, { status: 500 });
  }
}

/** Day keys + display labels, oldest first — matches the PageView.dayKey format. */
function bucketDayKeys(days: number): Array<{ key: string; label: string }> {
  const out: Array<{ key: string; label: string }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(new Date(), i);
    out.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  return out;
}
