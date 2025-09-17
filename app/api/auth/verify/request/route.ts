import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";

export const runtime = "nodejs";

function sixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

    // Invalidate any previous pending codes so there's only one active
    await prisma.emailVerification.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = sixDigit();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.emailVerification.create({
      data: { userId: user.id, email: user.email!, codeHash, expiresAt },
    });

    await sendVerificationEmail(user.email!, code);
    return NextResponse.json({ ok: true, sent: true, expiresInMinutes: 15 });
  } catch (e: any) {
    console.error("verify request fatal:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Unable to send verification email" }, { status: 500 });
  }
}
