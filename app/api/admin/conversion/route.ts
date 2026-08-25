// app/api/admin/conversion/route.ts
//
// Money is reported as SEPARATE, LABELLED figures per currency and never summed.
// The app operates in USD (ZW) and ZAR (ZA); adding minor units across
// currencies is exactly the class of error that produced "78 paid users".
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, subHours, startOfWeek, format } from "date-fns";
import { requireAdmin } from "../middleware";
import { getDocCountsByUser, getFirstDocAtByUser } from "@/lib/admin/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WEEKS = 8;

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const now = new Date();

    const [
      totalUsers,
      verifiedUsers,
      onboardedUsers,
      activatedUsers,
      attemptedUnlock,
      payingCustomers,
      purchaseCells,
      subscriptionCells,
      trialRows,
      stuckUnlocks,
      docsByMarket,
      recentPurchases,
      docCounts,
      firstDocAt,
      allUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.user.count({ where: { onboardingComplete: true } }),
      prisma.user.count({ where: { documents: { some: {} } } }),
      prisma.user.count({ where: { purchases: { some: { type: "RESUME_DOWNLOAD_UNLOCK" } } } }),
      prisma.user.count({
        where: {
          OR: [
            { purchases: { some: { status: "PAID", type: "RESUME_DOWNLOAD_UNLOCK" } } },
            { subscription: { status: "ACTIVE" } },
          ],
        },
      }),
      prisma.purchase.groupBy({
        by: ["currency", "type", "status"],
        _count: true,
        _sum: { amount: true },
      }),
      prisma.subscription.groupBy({ by: ["status", "tier", "market"], _count: true }),
      prisma.subscription.findMany({
        where: { status: "TRIALING" },
        orderBy: { trialEndsAt: "asc" },
        select: {
          id: true,
          tier: true,
          market: true,
          trialEndsAt: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.purchase.count({
        where: {
          type: "RESUME_DOWNLOAD_UNLOCK",
          status: "PENDING",
          createdAt: { lt: subHours(now, 24) },
        },
      }),
      prisma.document.groupBy({ by: ["market"], _count: true }),
      prisma.purchase.findMany({
        take: 200,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          currency: true,
          market: true,
          provider: true,
          providerRef: true,
          documentId: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      getDocCountsByUser(),
      getFirstDocAtByUser(),
      prisma.user.findMany({ select: { id: true, createdAt: true } }),
    ]);

    // Money — three distinct figures, grouped by currency, never added together.
    const sumBy = (predicate: (c: (typeof purchaseCells)[number]) => boolean) => {
      const out: Record<string, { minor: number; count: number }> = {};
      purchaseCells.filter(predicate).forEach((c) => {
        const entry = (out[c.currency] ??= { minor: 0, count: 0 });
        entry.minor += c._sum.amount ?? 0;
        entry.count += c._count;
      });
      return out;
    };

    const realRevenue = sumBy((c) => c.type === "RESUME_DOWNLOAD_UNLOCK" && c.status === "PAID");
    const pendingUnlocks = sumBy((c) => c.type === "RESUME_DOWNLOAD_UNLOCK" && c.status === "PENDING");
    const bonusGrantCount = purchaseCells
      .filter((c) => c.type === "SYSTEM_BONUS")
      .reduce((sum, c) => sum + c._count, 0);

    // Repeat users: Prisma can't express "has >= 2 related rows" in a count,
    // and doing it per-user would be an N+1 — derive from the single groupBy.
    let repeatUsers = 0;
    docCounts.forEach((count) => {
      if (count >= 2) repeatUsers++;
    });

    // Weekly signup -> activated-within-7-days cohorts, from maps already loaded.
    const createdAtById = new Map(allUsers.map((u) => [u.id, u.createdAt]));
    const cohortMap = new Map<string, { signups: number; activated: number }>();
    for (let i = WEEKS - 1; i >= 0; i--) {
      cohortMap.set(format(startOfWeek(subDays(now, i * 7)), "MMM dd"), { signups: 0, activated: 0 });
    }
    allUsers.forEach((u) => {
      const label = format(startOfWeek(u.createdAt), "MMM dd");
      const cell = cohortMap.get(label);
      if (!cell) return;
      cell.signups++;
      const first = firstDocAt.get(u.id);
      const created = createdAtById.get(u.id);
      if (first && created && first.getTime() - created.getTime() <= 7 * 86_400_000) cell.activated++;
    });

    return NextResponse.json({
      ok: true,
      data: {
        funnel: [
          { stage: "Signed up", count: totalUsers },
          { stage: "Verified email", count: verifiedUsers },
          { stage: "Onboarded", count: onboardedUsers },
          { stage: "Created a document", count: activatedUsers },
          { stage: "Attempted unlock", count: attemptedUnlock },
          { stage: "Paid", count: payingCustomers },
        ],
        rates: {
          activationRate: totalUsers ? (activatedUsers / totalUsers) * 100 : 0,
          repeatUsers,
          totalUsers,
          payingCustomers,
        },
        trials: {
          active: trialRows.length,
          rows: trialRows.map((t) => ({
            id: t.id,
            tier: t.tier,
            market: t.market,
            name: t.user.name,
            email: t.user.email,
            trialEndsAt: t.trialEndsAt ? t.trialEndsAt.toISOString() : null,
            daysRemaining: t.trialEndsAt
              ? Math.ceil((t.trialEndsAt.getTime() - now.getTime()) / 86_400_000)
              : null,
          })),
          byCell: subscriptionCells.map((s) => ({
            status: s.status,
            tier: s.tier,
            market: s.market,
            count: s._count,
          })),
          converted: subscriptionCells
            .filter((s) => s.status === "ACTIVE")
            .reduce((n, s) => n + s._count, 0),
        },
        money: { realRevenue, pendingUnlocks, bonusGrantCount, stuckUnlocks },
        marketSplit: docsByMarket.map((m) => ({ market: m.market, count: m._count })),
        cohorts: Array.from(cohortMap.entries()).map(([week, v]) => ({
          week,
          signups: v.signups,
          activated: v.activated,
          rate: v.signups ? (v.activated / v.signups) * 100 : 0,
        })),
        purchases: recentPurchases.map((p) => ({
          id: p.id,
          userName: p.user.name || "Anonymous",
          userEmail: p.user.email || "",
          amountMinor: p.amount,
          currency: p.currency,
          status: p.status,
          type: p.type,
          market: p.market,
          provider: p.provider,
          providerRef: p.providerRef,
          documentId: p.documentId,
          createdAt: p.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("admin conversion error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load conversion data" }, { status: 500 });
  }
}
