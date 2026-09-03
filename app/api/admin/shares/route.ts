// app/api/admin/shares/route.ts
//
// Does sharing actually bring anyone in.
//
// Two honesty constraints shape everything here. Public job pages are
// indexable, so a view is not evidence of a share — search and direct traffic
// land on the same URLs. And preview crawlers fetch every shared link, so raw
// renders overstate reach; those are filtered at write time, not here.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { requireAdmin } from "../middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOWS = [7, 30, 90] as const;

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get("days")) || 30, 1), 365);
    const since = subDays(new Date(), days);

    const [totals, windowed, firstEvent] = await Promise.all([
      prisma.jobShareEvent.groupBy({ by: ["kind"], _count: true }),
      prisma.jobShareEvent.groupBy({
        by: ["kind"],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
      prisma.jobShareEvent.findFirst({
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ]);

    const countOf = (rows: Array<{ kind: string; _count: number }>, kind: string) =>
      rows.find((r) => r.kind === kind)?._count ?? 0;

    // Distinct visitors, not raw views: one person refreshing a listing three
    // times is one person who saw it.
    const uniqueViewers = await prisma.jobShareEvent.findMany({
      where: { kind: "VIEWED", createdAt: { gte: since }, visitorId: { not: null } },
      distinct: ["visitorId"],
      select: { visitorId: true },
    });

    // Signed-out views are the acquisition-relevant ones — a signed-in user
    // opening a job page is already a customer.
    const signedOutViews = await prisma.jobShareEvent.count({
      where: { kind: "VIEWED", createdAt: { gte: since }, userId: null },
    });

    // Where the traffic came from. Messaging apps strip the referrer, so a null
    // host is "direct or an app", not "nowhere".
    const referrers = await prisma.jobShareEvent.groupBy({
      by: ["referrerHost"],
      where: { kind: "VIEWED", createdAt: { gte: since } },
      _count: true,
      orderBy: { _count: { referrerHost: "desc" } },
      take: 8,
    });

    // Which listings travel. Ordered by views, since that is what a share
    // actually produces.
    const topRaw = await prisma.jobShareEvent.groupBy({
      by: ["jobId"],
      where: { createdAt: { gte: since }, kind: { in: ["VIEWED", "SHARED"] } },
      _count: true,
      orderBy: { _count: { jobId: "desc" } },
      take: 10,
    });
    const topJobs = topRaw.length
      ? await prisma.jobPost.findMany({
          where: { id: { in: topRaw.map((t) => t.jobId) } },
          select: { id: true, title: true, company: true, bracket: true, market: true },
        })
      : [];

    // Per-job breakdown so a row can show shares and views separately.
    const perJob = await prisma.jobShareEvent.groupBy({
      by: ["jobId", "kind"],
      where: { createdAt: { gte: since }, jobId: { in: topRaw.map((t) => t.jobId) } },
      _count: true,
    });

    const jobRows = topRaw
      .map((t) => {
        const job = topJobs.find((j) => j.id === t.jobId);
        const forJob = perJob.filter((p) => p.jobId === t.jobId);
        return {
          jobId: t.jobId,
          title: job?.title ?? "(deleted listing)",
          company: job?.company ?? null,
          bracket: job?.bracket ?? null,
          market: job?.market ?? null,
          shared: forJob.find((p) => p.kind === "SHARED")?._count ?? 0,
          viewed: forJob.find((p) => p.kind === "VIEWED")?._count ?? 0,
          signups: forJob.find((p) => p.kind === "SIGNUP")?._count ?? 0,
        };
      })
      .sort((a, b) => b.viewed - a.viewed);

    // Which fields travel, which says what to seed more of.
    const bracketTotals = new Map<string, { viewed: number; signups: number }>();
    const allJobIds = await prisma.jobShareEvent.groupBy({
      by: ["jobId", "kind"],
      where: { createdAt: { gte: since }, kind: { in: ["VIEWED", "SIGNUP"] } },
      _count: true,
    });
    if (allJobIds.length) {
      const jobs = await prisma.jobPost.findMany({
        where: { id: { in: [...new Set(allJobIds.map((a) => a.jobId))] } },
        select: { id: true, bracket: true },
      });
      const bracketById = new Map(jobs.map((j) => [j.id, j.bracket ?? "Untagged"]));
      for (const row of allJobIds) {
        const key = bracketById.get(row.jobId) ?? "Untagged";
        const entry = bracketTotals.get(key) ?? { viewed: 0, signups: 0 };
        if (row.kind === "VIEWED") entry.viewed += row._count;
        if (row.kind === "SIGNUP") entry.signups += row._count;
        bracketTotals.set(key, entry);
      }
    }

    const shared = countOf(windowed, "SHARED");
    const viewed = countOf(windowed, "VIEWED");
    const signups = countOf(windowed, "SIGNUP");

    return NextResponse.json({
      ok: true,
      days,
      windows: WINDOWS,
      trackingSince: firstEvent?.createdAt.toISOString() ?? null,
      funnel: {
        shared,
        viewed,
        uniqueViewers: uniqueViewers.length,
        signedOutViews,
        signups,
        // Only meaningful once there is enough of each to divide.
        viewsPerShare: shared > 0 ? viewed / shared : null,
        signupRate: signedOutViews > 0 ? signups / signedOutViews : null,
      },
      allTime: {
        shared: countOf(totals, "SHARED"),
        viewed: countOf(totals, "VIEWED"),
        signups: countOf(totals, "SIGNUP"),
      },
      referrers: referrers.map((r) => ({ host: r.referrerHost, count: r._count })),
      topJobs: jobRows,
      byBracket: [...bracketTotals.entries()]
        .map(([bracket, v]) => ({ bracket, ...v }))
        .sort((a, b) => b.viewed - a.viewed),
    });
  } catch (error) {
    console.error("admin shares error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load share analytics" }, { status: 500 });
  }
}
