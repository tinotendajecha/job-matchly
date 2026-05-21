// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMarketFromRequest } from "@/lib/market/request";
import { getUserSubscription, isSubscriptionActive, getUsageSummary } from "@/lib/subscription/service";
import { PLAN_LIMITS } from "@/lib/pricing/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ ok: false }, { status: 401 });
  const market = getMarketFromRequest(req);

  const sub = await getUserSubscription(u.id);
  const active = sub ? isSubscriptionActive(sub) : false;
  const usage = active && sub ? await getUsageSummary(u.id) : null;
  const limits = sub ? PLAN_LIMITS[sub.tier] : null;

  return NextResponse.json(
    {
      ok: true,
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        credits: u.credits,
        emailVerified: u.emailVerified,
        isAdmin: u.isAdmin,
        market,
      },
      subscription: sub
        ? {
            tier: sub.tier,
            status: sub.status,
            billingCycle: sub.billingCycle,
            market: sub.market,
            trialEndsAt: sub.trialEndsAt,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            isActive: active,
          }
        : null,
      usage: usage
        ? {
            tailor: { count: usage.tailorCount, limit: limits?.tailorsPerMonth ?? null },
            download: { count: usage.downloadCount, limit: limits?.downloadsPerMonth ?? null },
            cover_letter: { count: usage.coverLetterCount, limit: limits?.coverLettersPerMonth ?? null },
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
