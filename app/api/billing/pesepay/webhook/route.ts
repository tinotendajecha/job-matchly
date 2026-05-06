// app/api/billing/pesepay/webhook/route.ts
import { NextResponse } from "next/server";
import { applyProviderWebhookUpdate, parsePesePayWebhook } from "@/lib/payments/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({} as any));
    const parsed = parsePesePayWebhook(payload);
    const result = await applyProviderWebhookUpdate(parsed);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Invalid webhook" },
      { status: 400 }
    );
  }
}
