// app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, code } = await req.json();
  if (!email || !code) return NextResponse.json({ ok: false, error: "Email & code required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

  // get latest active verification
  const v = await prisma.emailVerification.findFirst({
    where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
  });
  if (!v) return NextResponse.json({ ok: false, error: "No active verification code" }, { status: 400 });

  const ok = await bcrypt.compare(String(code), v.codeHash);
  if (!ok) return NextResponse.json({ ok: false, error: "Invalid code" }, { status: 400 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } }),
    prisma.emailVerification.update({ where: { id: v.id }, data: { consumedAt: new Date() } }),
    prisma.emailVerification.deleteMany({ where: { userId: user.id, id: { not: v.id } } }), // clean others
  ]);

  return NextResponse.json({ ok: true });
}
