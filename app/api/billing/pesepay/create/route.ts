// app/api/billing/pesepay/create/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createCreditTopupPurchase, initializePurchasePayment } from "@/lib/payments/service";
import { getMarketFromRequest } from "@/lib/market/request";

export const runtime = "nodejs";

type Body = {
  credits: number;
  currency?: "USD";
  description?: string;
};

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const { credits, description } = (await req.json()) as Body;
  const market = getMarketFromRequest(req);

  try {
    const purchase = await createCreditTopupPurchase({
      userId: user.id,
      credits,
      market,
      description,
    });
    const initialized = await initializePurchasePayment(purchase.id);
    return NextResponse.json({ ok: true, url: initialized.checkoutUrl, purchaseId: purchase.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "Initiation error" }, { status: 502 });
  }
}
