// app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ ok: false, error: "Email and code are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    // Already verified? no-op (don’t double-grant)
    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true, credits: user.credits });
    }

    // Find any unconsumed, unexpired code
    const rec = await prisma.emailVerification.findFirst({
      where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!rec) {
      return NextResponse.json({ ok: false, error: "Code expired or not found" }, { status: 400 });
    }

    const ok = await bcrypt.compare(String(code), rec.codeHash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Invalid code" }, { status: 400 });
    }

    // Atomic: mark verified + grant credits (+3) + consume code + audit purchase
    const BONUS = 2;
    await prisma.$transaction(async (tx) => {
      // guard against race: recheck inside the transaction
      const fresh = await tx.user.findUnique({ where: { id: user.id }, select: { emailVerified: true } });
      if (fresh?.emailVerified) return; // someone else finished the verify step

      await tx.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          credits: { increment: BONUS },
        },
      });

      await tx.emailVerification.update({
        where: { id: rec.id },
        data: { consumedAt: new Date() },
      });

      await tx.purchase.create({
        data: {
          userId: user.id,
          provider: "SYSTEM",
          amount: 0,
          currency: "USD",
          credits: BONUS,
          status: "PAID",
          meta: { reason: "Welcome bonus on email verification" },
        },
      });
    });

    // return updated credits for UI
    const updated = await prisma.user.findUnique({ where: { id: user.id }, select: { credits: true } });

    return NextResponse.json({ ok: true, verified: true, creditsAdded: BONUS, credits: updated?.credits ?? null });
  } catch (e: any) {
    console.error("verify confirm fatal:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Could not verify email" }, { status: 500 });
  }
}
