// app/api/billing/pesepay/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizePaidPurchaseOnce } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({} as any));
  const providerRef =
    payload?.referenceNumber ||
    payload?.reference ||
    payload?.transaction?.referenceNumber ||
    payload?.transaction?.reference;

  const statusRaw =
    payload?.status ||
    payload?.transaction?.status ||
    payload?.paymentStatus;

  if (!providerRef) {
    return NextResponse.json({ ok: false, error: "Missing reference" }, { status: 400 });
  }

  const purchase = await prisma.purchase.findFirst({ where: { providerRef } });
  if (!purchase) return NextResponse.json({ ok: false, error: "Purchase not found" }, { status: 404 });

  const s = String(statusRaw || "").toUpperCase();
  const newStatus =
    s.includes("PAID") || s.includes("SUCCESS") ? "PAID" :
    s.includes("FAILED") ? "FAILED" :
    s.includes("CANCEL") ? "CANCELED" : "PENDING";

  // Save latest payload for audits
  const baseMeta =
    purchase.meta && typeof purchase.meta === "object" && !Array.isArray(purchase.meta)
      ? (purchase.meta as Record<string, unknown>)
      : {};
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: newStatus as any, meta: { ...baseMeta, webhook: payload } as any },
  });

  if (newStatus === "PAID") {
    await finalizePaidPurchaseOnce(purchase.id);
  }

  return NextResponse.json({ ok: true });
}
