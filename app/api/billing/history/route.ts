// app/api/billing/history/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { describePurchase } from "@/lib/payments/service";
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
      type: true,
      market: true,
      provider: true,
      status: true,
      amount: true,
      currency: true,
      credits: true,
      documentId: true,
      document: {
        select: {
          title: true,
        },
      },
      providerRef: true,
    },
  });

  const items = rows.map((p) => ({
    id: p.id,
    date: p.createdAt,
    type: p.type,
    market: p.market,
    provider: p.provider,
    description: describePurchase(p),
    amountMinor: p.amount,
    currency: p.currency,
    status: p.status,
    documentId: p.documentId,
    providerRef: p.providerRef,
  }));

  return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
}
