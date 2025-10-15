// app/api/billing/pesepay/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PesePayClient } from "pesepay-js";
import { finalizePaidPurchaseOnce } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const purchaseId = searchParams.get("purchaseId");
  if (!purchaseId) return NextResponse.json({ ok: false, error: "Missing purchaseId" }, { status: 400 });

  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  if (["PAID", "FAILED", "CANCELED"].includes(purchase.status)) {
    return NextResponse.json({ ok: true, status: purchase.status });
  }

  const ref = purchase.providerRef;
  if (!ref) return NextResponse.json({ ok: true, status: purchase.status });

  const integrationKey = process.env.PESEPAY_INTEGRATION_KEY!;
  const encryptionKey = process.env.PESEPAY_ENCRYPTION_KEY!;
  const client = new PesePayClient(integrationKey, encryptionKey);

  try {
    const res = await client.checkPaymentStatus(ref);
    // Typical fields: transactionStatus, message, etc.
    const s = String(res?.transactionStatus || "").toUpperCase();
    const newStatus =
      s.includes("PAID") || s.includes("SUCCESS") ? "PAID" :
      s.includes("FAILED") ? "FAILED" :
      s.includes("CANCEL") ? "CANCELED" : "PENDING";

   if (newStatus !== purchase.status) {
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: newStatus as any, meta: { ...(purchase.meta as any), statusCheck: res } },
  });
}
if (newStatus === "PAID") {
  await finalizePaidPurchaseOnce(purchase.id);
}

    return NextResponse.json({ ok: true, status: newStatus });
  } catch (e: any) {
    return NextResponse.json({ ok: true, status: purchase.status });
  }
}
