import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createOrReuseResumeUnlockPurchase, initializePurchasePayment } from "@/lib/payments/service";
import { getMarketFromRequest } from "@/lib/market/request";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  try {
    const result = await createOrReuseResumeUnlockPurchase({
      userId: user.id,
      documentId: params.id,
      market: getMarketFromRequest(req),
    });

    if (result.alreadyUnlocked || !result.purchase) {
      return NextResponse.json({ ok: true, alreadyUnlocked: true, purchaseId: null, url: null });
    }

    const initialized = await initializePurchasePayment(result.purchase.id);

    return NextResponse.json({
      ok: true,
      alreadyUnlocked: false,
      purchaseId: result.purchase.id,
      url: initialized.checkoutUrl,
      provider: result.purchase.provider,
      market: result.purchase.market,
    });
  } catch (error: any) {
    const message = error?.message || "Could not start checkout";
    const status =
      message === "DOCUMENT_NOT_FOUND"
        ? 404
        : message === "DOCUMENT_UNLOCK_NOT_SUPPORTED"
        ? 400
        : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
