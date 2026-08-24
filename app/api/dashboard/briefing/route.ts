// app/api/dashboard/briefing/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { BRIEFING_FEATURED, BRIEFING_ITEMS } from "@/app/app/dashboard/data/briefing";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const rows = await prisma.briefingItem.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 5,
    });

    if (rows.length === 0) {
      return NextResponse.json({
        ok: true,
        featured: BRIEFING_FEATURED,
        items: BRIEFING_ITEMS,
        fallback: true,
      });
    }

    const [featuredRow, ...rest] = rows;
    const toItem = (row: (typeof rows)[number]) => ({
      id: row.id,
      source: row.source.toLowerCase(),
      sourceDetail: row.sourceDetail,
      category: row.category,
      title: row.title,
      summary: row.summary,
      image: row.image ?? "",
      readTime: row.readTime,
      stat: row.stat ?? "",
      url: row.url,
    });

    return NextResponse.json({
      ok: true,
      featured: toItem(featuredRow),
      items: rest.map(toItem),
      fallback: false,
    });
  } catch (err: any) {
    console.error("dashboard/briefing error", err);
    return NextResponse.json(
      { ok: true, featured: BRIEFING_FEATURED, items: BRIEFING_ITEMS, fallback: true },
      { status: 200 }
    );
  }
}
