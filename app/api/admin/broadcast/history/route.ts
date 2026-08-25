// app/api/admin/broadcast/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const broadcasts = await prisma.emailBroadcast.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ ok: true, data: { broadcasts } });
  } catch (error) {
    console.error("broadcast/history error:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch history" }, { status: 500 });
  }
}
