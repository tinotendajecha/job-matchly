import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { describePurchase, getPurchaseForUser, syncPurchaseStatus } from "@/lib/payments/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const purchaseId = searchParams.get("purchaseId");
  if (!purchaseId) {
    return NextResponse.json({ ok: false, error: "Missing purchaseId" }, { status: 400 });
  }

  try {
    const status = await syncPurchaseStatus(purchaseId);
    const purchase = await getPurchaseForUser(purchaseId, user.id);

    return NextResponse.json({
      ok: true,
      status,
      purchase: {
        id: purchase.id,
        type: purchase.type,
        provider: purchase.provider,
        market: purchase.market,
        description: describePurchase(purchase),
        documentId: purchase.documentId,
      },
    });
  } catch (error: any) {
    const message = error?.message || "Could not verify purchase";
    const status = message === "PURCHASE_NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
