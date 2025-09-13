// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth"; // keep as-is

const COOKIE = "session_token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }
  if (!user.emailVerified) {
    return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  const { token, expires } = await createSession(user.id);

  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, credits: user.credits },
  });

  res.cookies.set({
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });

  return res;
}
