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

    // For chart
    let chartData: any[] = [];
    for (let i = 0; i < 30; ++i) {
      const day = subDays(today, 29 - i);
      const nextDay = subDays(today, 28 - i);
      const [tailored, cover, created] = await Promise.all([
        prisma.document.count({
          where: {
            kind: "TAILORED_RESUME",
            createdAt: { gte: day, lt: nextDay },
          },
        }),
        prisma.document.count({
          where: {
            kind: "COVER_LETTER",
            createdAt: { gte: day, lt: nextDay },
          },
        }),
        prisma.document.count({
          where: {
            kind: "CREATED_RESUME",
            createdAt: { gte: day, lt: nextDay },
          },
        }),
      ]);
      chartData.push({
        date: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        tailored,
        cover,
        created,
      });
    }

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
