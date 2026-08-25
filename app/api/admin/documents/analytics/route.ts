import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../middleware";
import { subDays, startOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  try {
    // Total docs + by type
    const totalDocuments = await prisma.document.count();
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = subDays(now, 7);

    const [documentsToday, documentsThisWeek] = await Promise.all([
      prisma.document.count({ where: { createdAt: { gte: today } } }),
      prisma.document.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    const byType = await prisma.document.groupBy({
      by: ["kind"],
      _count: true,
    });

    // For chart — one query for the whole 30-day window, bucketed in JS (avoids 90 sequential round-trips)
    const thirtyDaysAgo = subDays(today, 30);
    const recentDocs = await prisma.document.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { kind: true, createdAt: true },
    });

    const chartMap = new Map<string, { date: string; tailored: number; cover: number; created: number }>();
    for (let i = 0; i < 30; ++i) {
      const day = subDays(today, 29 - i);
      const key = day.toDateString();
      chartMap.set(key, {
        date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        tailored: 0,
        cover: 0,
        created: 0,
      });
    }
    recentDocs.forEach((doc) => {
      const key = startOfDay(doc.createdAt).toDateString();
      const bucket = chartMap.get(key);
      if (!bucket) return;
      if (doc.kind === "TAILORED_RESUME") bucket.tailored++;
      else if (doc.kind === "COVER_LETTER") bucket.cover++;
      else if (doc.kind === "CREATED_RESUME") bucket.created++;
    });
    const chartData = Array.from(chartMap.values());

    // Average per user
    const userCount = await prisma.user.count();
    const avgPerUser = userCount ? (totalDocuments / userCount).toFixed(1) : "0";

    return NextResponse.json({
      ok: true,
      data: {
        totalDocuments,
        documentsToday,
        documentsThisWeek,
        avgPerUser,
        statsByType: {
          tailored: byType.find((x) => x.kind === "TAILORED_RESUME")?._count || 0,
          cover: byType.find((x) => x.kind === "COVER_LETTER")?._count || 0,
          created: byType.find((x) => x.kind === "CREATED_RESUME")?._count || 0,
        },
        chartData,
      },
    });
  } catch (e) {
    console.error("documents/analytics error", e);
    return NextResponse.json({ ok: false, error: "Analytics fetch failed" }, { status: 500 });
  }
}
