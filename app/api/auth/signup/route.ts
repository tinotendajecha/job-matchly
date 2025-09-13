// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/mail";

export const runtime = "nodejs";

function sixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) return NextResponse.json({ ok: false, error: "Email & password required" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ ok: false, error: "Email already in use" }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, name: name || "", passwordHash, credits: 0 } });

    // create verification code
    const code = sixDigit();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min
    await prisma.emailVerification.create({
      data: { userId: user.id, email: user.email!, codeHash, expiresAt },
    });

    await sendVerificationEmail(user.email!, code);
    return NextResponse.json({ ok: true, message: "Verification code sent" });
  } catch (e: any) {
    console.error("signup fatal:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Signup failed" }, { status: 500 });
  }
}
