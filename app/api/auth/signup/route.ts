// app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consentVersionFor, recordConsent } from '@/lib/consent/service';
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/mail";
import { getMarketFromRequest } from "@/lib/market/request";

export const runtime = "nodejs";

function sixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  try {
    const { email, password, name, consentGiven } = await req.json();
    if (!email || !password) return NextResponse.json({ ok: false, error: "Email & password required" }, { status: 400 });
    if (!consentGiven) return NextResponse.json({ ok: false, error: "You must agree to the Data Protection & Consent Agreement" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ ok: false, error: "Email already in use" }, { status: 400 });

    const market = getMarketFromRequest(req);
    // Trust the server's current version over whatever the client posted — a
    // stale or forged version string would misstate what was actually agreed.
    const resolvedConsentVersion = consentVersionFor(market);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || "",
        passwordHash,
        consentGiven: true,
        consentGivenAt: new Date(),
        consentVersion: resolvedConsentVersion,
      },
    });

    // Signup consent covers the agreement only. Recruiter visibility is a
    // separate, later decision and is deliberately not granted here.
    await recordConsent({
      userId: user.id,
      purpose: 'ACCOUNT_TERMS',
      granted: true,
      version: resolvedConsentVersion,
      source: 'signup',
    });

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
