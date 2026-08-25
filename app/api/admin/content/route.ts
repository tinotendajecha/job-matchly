// app/api/admin/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { requireAdmin } from "../middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const weekAgo = subDays(new Date(), 7);

    const [
      totalArticles,
      articlesThisWeek,
      byCategoryRaw,
      bySourceRaw,
      recentItems,
      recentRuns,
    ] = await Promise.all([
      prisma.briefingItem.count(),
      prisma.briefingItem.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.briefingItem.groupBy({ by: ["category"], _count: true }),
      prisma.briefingItem.groupBy({ by: ["source"], _count: true }),
      prisma.briefingItem.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          source: true,
          sourceDetail: true,
          url: true,
          createdAt: true,
        },
      }),
      prisma.ingestRun.findMany({
        take: 10,
        orderBy: { startedAt: "desc" },
      }),
    ]);

    const byCategory = byCategoryRaw
      .map((item) => ({ category: item.category, count: item._count }))
      .sort((a, b) => b.count - a.count);

    const bySource = bySourceRaw
      .map((item) => ({ source: item.source, count: item._count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      ok: true,
      data: {
        totalArticles,
        articlesThisWeek,
        byCategory,
        bySource,
        recentItems,
        recentRuns,
      },
    });
  } catch (error) {
    console.error("Admin content API error:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch content data" }, { status: 500 });
  }
}
