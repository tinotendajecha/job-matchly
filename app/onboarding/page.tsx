// app/onboarding/page.tsx (SERVER COMPONENT)
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingClient from "./client";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?next=/onboarding");
  if (!user.emailVerified) redirect(`/auth/verify?email=${encodeURIComponent(user.email ?? "")}`);
  if (user.onboardingComplete) redirect("/app/dashboard");

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  // 👇 fetch the latest CREATED_RESUME (often the onboarding upload)
  const recentResume = await prisma.document.findFirst({
    where: { userId: user.id, kind: "CREATED_RESUME" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, markdown: true },
  });

  return (
    <OnboardingClient
      initialUser={{ name: user.name ?? "", email: user.email ?? "" }}
      initialProfile={{
        headline: profile?.headline ?? "",
        location: profile?.location ?? "",
        phone: profile?.phone ?? "",
        website: profile?.website ?? "",
        linkedInUrl: profile?.linkedInUrl ?? "",
        school: profile?.school ?? "",
        degree: profile?.degree ?? "",
        graduationYear: profile?.graduationYear ?? "",
        skills: Array.isArray(profile?.skills) ? (profile!.skills as string[]) : [],
        targetRoles: profile?.targetRoles ?? "",
        targetLocations: profile?.targetLocations ?? "",
      jobType: profile?.jobType ?? "",
      }}
      initialResume={
        recentResume
          ? {
              id: recentResume.id,
              title: recentResume.title || "Imported Resume",
              markdown: recentResume.markdown || "",
            }
          : null
      }
    />
  );
}
