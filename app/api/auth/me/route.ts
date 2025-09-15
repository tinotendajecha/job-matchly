// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({
    ok: true,
    user: { id: u.id, email: u.email, name: u.name, credits: u.credits, emailVerified: u.emailVerified },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
