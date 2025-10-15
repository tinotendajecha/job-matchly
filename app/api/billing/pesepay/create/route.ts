// app/api/billing/pesepay/create/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSubtotalUSD, toMinorUnits } from "@/lib/pricing";
import { PesePayClient } from "pesepay-js";
import { toJsonValue } from "@/lib/json";

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

  const { credits, currency = "USD", description } = (await req.json()) as Body;
  const cleanCredits = Math.max(3, Math.floor(credits || 3));
  const subtotalUSD = computeSubtotalUSD(cleanCredits);
  const amountMinor = toMinorUnits(subtotalUSD);

  const purchase = await prisma.purchase.create({
    data: {
      userId: user.id,
      provider: "PESEPAY",
      amount: amountMinor,
      currency,
      credits: cleanCredits,
      status: "PENDING",
      meta: {
        description: description ?? `Credits purchase (${cleanCredits})`,
        pricingVersion: "promo_2_for_10",
        subtotalUSD,
      },
    },
  });

  const integrationKey = process.env.PESEPAY_INTEGRATION_KEY!;
  const encryptionKey = process.env.PESEPAY_ENCRYPTION_KEY!;
  const appBase = process.env.APP_BASE_URL!;

  const resultUrl = `${appBase}/api/billing/pesepay/webhook`;
  // const returnUrl = `${appBase}/app/billing?purchase=${purchase.id}`;
  const returnUrl = `${appBase}/app/checkout/${purchase.id}`;

  // Initialize SDK client
  const client = new PesePayClient(integrationKey, encryptionKey);

  // Build transaction details for redirect flow
  const transactionDetails = {
    amountDetails: { amount: +subtotalUSD.toFixed(2), currencyCode: currency },
    reasonForPayment: `Jobmatchly ${cleanCredits} credits`,
    resultUrl,
    returnUrl,
    // Optional: include customer hints
    customer: {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    },
    // Use your internal id to reconcile (merchant reference)
    merchantReference: purchase.id,
  };

  try {
    const init = await client.initiateTransaction(transactionDetails);
    const redirectUrl: string | undefined = init?.redirectUrl;
    const referenceNumber: string | null = init?.referenceNumber ?? null;
    const pollUrl: string | undefined = init?.pollUrl;

    // Normalize meta object
    const baseMeta =
      purchase.meta && typeof purchase.meta === "object" && !Array.isArray(purchase.meta)
        ? (purchase.meta as Record<string, unknown>)
        : {};

    if (!redirectUrl) {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          status: "FAILED",
          meta: { ...baseMeta, initError: toJsonValue(init) }, // <= sanitize
        },
      });
    }

    const initJson = toJsonValue(init); // <= sanitize once
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        providerRef: referenceNumber,
        meta: { ...baseMeta, pollUrl, redirectUrl, pesepayInit: initJson }, // <= sanitize
      },
    });

    return NextResponse.json({ ok: true, url: redirectUrl, purchaseId: purchase.id });
  } catch (err: any) {
    const baseMeta =
      purchase.meta && typeof purchase.meta === "object" && !Array.isArray(purchase.meta)
        ? (purchase.meta as Record<string, unknown>)
        : {};
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: "FAILED", meta: { ...baseMeta, initException: String(err?.message || err) } },
    });
    return NextResponse.json({ ok: false, error: "Initiation error" }, { status: 502 });
  }
}
