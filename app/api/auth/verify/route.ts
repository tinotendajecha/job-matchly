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
    if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

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

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      prisma.emailVerification.update({
        where: { id: rec.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true, verified: true });
  } catch (e: any) {
    console.error("verify confirm fatal:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Could not verify email" }, { status: 500 });
  }
}
