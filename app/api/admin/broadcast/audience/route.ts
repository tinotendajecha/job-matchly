// app/api/admin/broadcast/audience/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../middleware";
import { buildUserFilterWhere, parseUserFilter, describeUserFilter } from "@/lib/admin/userFilter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const filter = parseUserFilter(searchParams);
    const where = buildUserFilterWhere(filter, { emailableOnly: true });

    const [count, sample, optedOut] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true },
      }),
      prisma.user.count({ where: { marketingOptOut: true } }),
    ]);

    return NextResponse.json({
      ok: true,
      data: { count, sample, optedOut, description: describeUserFilter(filter) },
    });
  } catch (error) {
    console.error("broadcast/audience error:", error);
    return NextResponse.json({ ok: false, error: "Failed to build audience" }, { status: 500 });
  }
}
