// app/api/billing/pesepay/webhook/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Parse provider payload
  const payload = await req.json().catch(() => ({} as any));
  // Identify the purchase (use providerRef from payload)
  const providerRef = payload?.reference || payload?.transaction?.reference;
  const status = payload?.status || payload?.transaction?.status; // e.g., "PAID","FAILED"

  if (!providerRef) return NextResponse.json({ ok: false, error: "Missing reference" }, { status: 400 });

  const purchase = await prisma.purchase.findFirst({ where: { providerRef } });
  if (!purchase) return NextResponse.json({ ok: false, error: "Purchase not found" }, { status: 404 });

  // Idempotency: if already paid, just ack
  if (purchase.status === "PAID") return NextResponse.json({ ok: true });

  const newStatus =
    String(status).toUpperCase() === "PAID" ? "PAID" :
    String(status).toUpperCase() === "FAILED" ? "FAILED" :
    String(status).toUpperCase() === "CANCELED" ? "CANCELED" : "PENDING";

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: newStatus as any, meta: payload },
  });

  if (newStatus === "PAID") {
    await addCredits(purchase.userId, purchase.credits);
  }

  return NextResponse.json({ ok: true });
}
