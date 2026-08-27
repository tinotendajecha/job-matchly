// app/api/admin/jobs/route.ts
//
// Admin-only view over the job archive. Nothing here is reachable by job
// seekers — liveJobWhere() matches ACTIVE only, so EXPIRED and ARCHIVED rows
// exist purely as market history for us.
import { NextRequest, NextResponse } from "next/server";
import type { JobStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { requireAdmin } from "../middleware";
import { EXPIRED_JOB_ARCHIVE_DAYS } from "@/lib/jobs/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

/** Statuses an admin can browse. ACTIVE is included so the archive can be compared against the live feed. */
const BROWSABLE: JobStatus[] = ["ARCHIVED", "EXPIRED", "ACTIVE"];

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const params = request.nextUrl.searchParams;
    const page = Math.max(Number(params.get("page")) || 1, 1);
    const q = (params.get("q") || "").trim();
    const requestedStatus = (params.get("status") || "").toUpperCase() as JobStatus;
    const status: JobStatus | "ALL" = BROWSABLE.includes(requestedStatus)
      ? requestedStatus
      : "ALL";

    const where: Prisma.JobPostWhereInput = {
      ...(status === "ALL" ? { status: { in: BROWSABLE } } : { status }),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { company: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const weekAgo = subDays(new Date(), 7);

    const [byStatusRaw, total, rows, closedThisWeek, byMarketRaw, oldest, runs] =
      await Promise.all([
        prisma.jobPost.groupBy({ by: ["status"], _count: true }),
        prisma.jobPost.count({ where }),
        prisma.jobPost.findMany({
          where,
          // Closed listings sort by when they left the market; ACTIVE rows have
          // no closedAt, so createdAt keeps them in a sensible order too.
          orderBy: [{ closedAt: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true,
            title: true,
            company: true,
            market: true,
            bracket: true,
            source: true,
            url: true,
            status: true,
            postedAt: true,
            closedAt: true,
            lastSeenAt: true,
            createdAt: true,
          },
        }),
        prisma.jobPost.count({ where: { closedAt: { gte: weekAgo } } }),
        prisma.jobPost.groupBy({
          by: ["market"],
          where: { status: { in: ["EXPIRED", "ARCHIVED"] } },
          _count: true,
        }),
        prisma.jobPost.findFirst({
          where: { closedAt: { not: null } },
          orderBy: { closedAt: "asc" },
          select: { closedAt: true },
        }),
        prisma.ingestRun.findMany({
          where: { kind: "JOBS" },
          orderBy: { startedAt: "desc" },
          take: 8,
          select: {
            id: true,
            trigger: true,
            status: true,
            saved: true,
            skipped: true,
            meta: true,
            startedAt: true,
            finishedAt: true,
          },
        }),
      ]);

    const counts = Object.fromEntries(
      byStatusRaw.map((r) => [r.status, r._count])
    ) as Partial<Record<JobStatus, number>>;

    // Time-on-market is the whole point of keeping these rows. It is only
    // meaningful where we know both ends, so it is computed over that subset
    // and reported with its own sample size rather than implied as complete.
    const spans = await prisma.$queryRaw<Array<{ days: number | null; n: bigint }>>`
      SELECT AVG(EXTRACT(EPOCH FROM ("closedAt" - "postedAt")) / 86400)::float AS days,
             COUNT(*)::bigint AS n
      FROM "JobPost"
      WHERE "closedAt" IS NOT NULL
        AND "postedAt" IS NOT NULL
        AND "closedAt" > "postedAt"`;

    return NextResponse.json({
      ok: true,
      stats: {
        active: counts.ACTIVE ?? 0,
        expired: counts.EXPIRED ?? 0,
        archived: counts.ARCHIVED ?? 0,
        closedThisWeek,
        archiveAfterDays: EXPIRED_JOB_ARCHIVE_DAYS,
        historySince: oldest?.closedAt?.toISOString() ?? null,
        avgDaysOnMarket: spans[0]?.days ?? null,
        avgSampleSize: Number(spans[0]?.n ?? 0),
        byMarket: byMarketRaw.map((m) => ({ market: m.market, count: m._count })),
      },
      status,
      q,
      jobs: rows.map((j) => ({
        ...j,
        postedAt: j.postedAt?.toISOString() ?? null,
        closedAt: j.closedAt?.toISOString() ?? null,
        lastSeenAt: j.lastSeenAt?.toISOString() ?? null,
        createdAt: j.createdAt.toISOString(),
      })),
      // Coverage per run. A drop in listings is only a market signal once you
      // can see that the crawl behind it reached as much ground as the last one.
      runs: runs.map((r) => ({
        ...r,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString() ?? null,
      })),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    });
  } catch (error) {
    console.error("admin jobs error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load job archive" },
      { status: 500 }
    );
  }
}
