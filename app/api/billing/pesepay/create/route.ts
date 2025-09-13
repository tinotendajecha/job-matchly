// app/api/billing/pesepay/create/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PACKS = {
  basic: { name: "50 credits",  amount: 500,  credits: 50, currency: "USD" },
  pro:   { name: "150 credits", amount: 1200, credits: 150, currency: "USD" },
  mega:  { name: "500 credits", amount: 3500, credits: 500, currency: "USD" },
} as const;

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const { pack }: { pack: keyof typeof PACKS } = await req.json();
  const p = PACKS[pack];
  if (!p) return NextResponse.json({ ok: false, error: "Invalid pack" }, { status: 400 });

  // 1) create local purchase
  const purchase = await prisma.purchase.create({
    data: {
      userId: user.id,
      amount: p.amount,
      currency: p.currency,
      credits: p.credits,
      status: "PENDING",
      meta: { pack },
    },
  });

  // 2) call PesePay API here to initialize payment
  // const pesepayResp = await pesepay.createTransaction({ ... })
  // const redirectUrl = pesepayResp.redirectUrl
  // const providerRef = pesepayResp.reference

  // For now, return placeholder values; update purchase with providerRef when you have it:
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/billing/placeholder?purchase=${purchase.id}`;
  // await prisma.purchase.update({ where: { id: purchase.id }, data: { providerRef } });

  return NextResponse.json({ ok: true, url: redirectUrl, purchaseId: purchase.id });
}
