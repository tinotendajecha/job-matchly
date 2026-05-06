// app/api/billing/pesepay/status/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPurchaseForUser, syncPurchaseStatus } from "@/lib/payments/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const purchaseId = searchParams.get("purchaseId");
  if (!purchaseId) return NextResponse.json({ ok: false, error: "Missing purchaseId" }, { status: 400 });

  try {
    await getPurchaseForUser(purchaseId, user.id);
    const status = await syncPurchaseStatus(purchaseId);
    return NextResponse.json({ ok: true, status });
  } catch (e: any) {
    const status = e?.message === "PURCHASE_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ ok: false, error: e?.message || "Could not check payment" }, { status });
  }
}
