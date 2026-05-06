import { NextResponse } from "next/server";
import { parsePaystackWebhook } from "@/lib/payments/providers/paystack";
import { applyProviderWebhookUpdate } from "@/lib/payments/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const event = parsePaystackWebhook(rawBody, signature);
    const result = await applyProviderWebhookUpdate(event);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("paystack webhook fatal:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Invalid webhook" },
      { status: 400 }
    );
  }
}
