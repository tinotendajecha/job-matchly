// app/api/profile/resume/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  if (!user.emailVerified) return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { resumeMarkdown: true, resumeFileName: true, resumeUpdatedAt: true },
  });

  return NextResponse.json({
    ok: true,
    resumeMarkdown: profile?.resumeMarkdown || "",
    resumeFileName: profile?.resumeFileName || "",
    resumeUpdatedAt: profile?.resumeUpdatedAt || null,
  });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  if (!user.emailVerified) return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });

  const { resumeMarkdown, resumeFileName } = await req.json();
  if (!resumeMarkdown || !resumeFileName) {
    return NextResponse.json({ ok: false, error: "Missing resumeMarkdown or resumeFileName" }, { status: 400 });
  }

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      resumeMarkdown,
      resumeFileName,
      resumeUpdatedAt: new Date(),
    },
    update: {
      resumeMarkdown,
      resumeFileName,
      resumeUpdatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
