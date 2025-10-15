// app/api/billing/history/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const rows = await prisma.purchase.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      status: true,
      amount: true,
      currency: true,
      credits: true,
      providerRef: true,
      meta: true,
    },
  });

  // shape for UI
  const items = rows.map((p) => ({
    id: p.id,
    date: p.createdAt,
    description: `Credits (${p.credits})`,
    amount: (p.amount / 100).toFixed(2),
    currency: p.currency,
    status: p.status,
    providerRef: p.providerRef,
  }));

  return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
}
