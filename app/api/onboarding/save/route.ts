// app/api/onboarding/save/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    if (!user.emailVerified) return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const {
      // basics
      name, headline, location, phone, website, linkedInUrl, email,
      // education
      school, degree, graduationYear,
      // skills & prefs
      skills, targetRoles, targetLocations, jobType,
      // finalization
      complete,
    } = body || {};

    // allow name/email tweaks on User
    const userUpdate: any = {};
    if (typeof name === "string") userUpdate.name = name;
    if (typeof email === "string") userUpdate.email = email;

    // profile upsert
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        headline, location, phone, website, linkedInUrl,
        school, degree, graduationYear,
        skills: Array.isArray(skills) ? skills : undefined,
        targetRoles, targetLocations, jobType,
      },
      update: {
        headline, location, phone, website, linkedInUrl,
        school, degree, graduationYear,
        skills: Array.isArray(skills) ? skills : undefined,
        targetRoles, targetLocations, jobType,
      },
    });

    // update user (+ mark onboarding complete if requested)
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...userUpdate,
        onboardingComplete: complete ? true : undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, onboardingComplete: updatedUser.onboardingComplete },
      profile,
    });
  } catch (err: any) {
    console.error("onboarding save fatal:", err?.message || err);
    return NextResponse.json({ ok: false, error: "Server error while saving" }, { status: 500 });
  }
}
