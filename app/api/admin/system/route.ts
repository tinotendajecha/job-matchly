// app/api/admin/system/route.ts
//
// Every value here is measured or observed. Nothing is invented — the previous
// System page showed random API latency, a hardcoded 99.9% uptime and fake IP
// addresses, none of which this app has ever collected.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { requireAdmin } from "../middleware";
import { PAGEVIEW_RETENTION_DAYS } from "@/lib/analytics/prune";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Only the NAME and a boolean ever leave this route — never the value, never a
 * length, never a masked prefix. A masked prefix on a page any XSS can read is
 * still a leak.
 */
const TRACKED_ENV = [
  { key: "DATABASE_URL", group: "Database" },
  { key: "RESEND_API_KEY", group: "Email" },
  { key: "EMAIL_FROM", group: "Email" },
  { key: "BROADCAST_FROM", group: "Email" },
  { key: "BROADCAST_REPLY_TO", group: "Email" },
  { key: "UNSUBSCRIBE_SECRET", group: "Email" },
  { key: "PAYSTACK_SECRET_KEY", group: "Payments (ZA)" },
  { key: "PAYSTACK_PUBLIC_KEY", group: "Payments (ZA)" },
  { key: "PESEPAY_INTEGRATION_KEY", group: "Payments (ZW)" },
  { key: "PESEPAY_ENCRYPTION_KEY", group: "Payments (ZW)" },
  { key: "OPENAI_API_KEY", group: "AI & Content" },
  { key: "TAVILY_API_KEY", group: "AI & Content" },
  { key: "CRON_SECRET", group: "Automation" },
  { key: "GOOGLE_CLIENT_ID", group: "Auth" },
  { key: "GOOGLE_CLIENT_SECRET", group: "Auth" },
  { key: "NEXT_PUBLIC_APP_URL", group: "App" },
  { key: "DEFAULT_MARKET", group: "App" },
] as const;

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const sevenDaysAgo = subDays(new Date(), 7);

    // Real measured round-trip, not a stored constant.
    const pingStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - pingStart;

    const [
      users,
      documents,
      purchases,
      sessions,
      pageViews,
      briefingItems,
      broadcasts,
      deliveries,
      lastIngest,
      oldestPageView,
      failedIngests,
      failedDeliveries,
      failedPurchases,
      errorsLast7Days,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.purchase.count(),
      prisma.session.count(),
      prisma.pageView.count(),
      prisma.briefingItem.count(),
      prisma.emailBroadcast.count(),
      prisma.emailDelivery.count(),
      prisma.ingestRun.findFirst({ orderBy: { startedAt: "desc" } }),
      prisma.pageView.aggregate({ _min: { createdAt: true } }),
      prisma.ingestRun.findMany({
        where: { status: "FAILED" },
        orderBy: { startedAt: "desc" },
        take: 25,
      }),
      prisma.emailDelivery.findMany({
        where: {
          OR: [
            { accepted: false },
            { error: { not: null } },
            { lastEvent: { in: ["bounced", "complained", "delivery_delayed"] } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          id: true,
          email: true,
          lastEvent: true,
          error: true,
          createdAt: true,
          broadcast: { select: { subject: true } },
        },
      }),
      prisma.purchase.findMany({
        where: { status: "FAILED" },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, type: true, market: true, currency: true, createdAt: true },
      }),
      prisma.emailDelivery.count({
        where: { createdAt: { gte: sevenDaysAgo }, OR: [{ accepted: false }, { error: { not: null } }] },
      }),
    ]);

    const errors = [
      ...failedIngests.map((r) => ({
        id: r.id,
        source: "Content ingest",
        message: r.errorMessage || "Ingest run failed",
        context: `${r.trigger.toLowerCase()} run`,
        at: r.startedAt.toISOString(),
      })),
      ...failedDeliveries.map((d) => ({
        id: d.id,
        source: "Email",
        message: d.error || `Delivery ${d.lastEvent ?? "not accepted"}`,
        context: `${d.email} · ${d.broadcast?.subject ?? "broadcast"}`,
        at: d.createdAt.toISOString(),
      })),
      ...failedPurchases.map((p) => ({
        id: p.id,
        source: "Payments",
        message: "Payment failed",
        context: `${p.type.replace(/_/g, " ").toLowerCase()} · ${p.market} ${p.currency}`,
        at: p.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 30);

    const oldest = oldestPageView._min.createdAt;

    return NextResponse.json({
      ok: true,
      data: {
        database: { ok: true, latencyMs: dbLatencyMs },
        counts: { users, documents, purchases, sessions, pageViews, briefingItems, broadcasts, deliveries },
        integrations: TRACKED_ENV.map(({ key, group }) => ({
          key,
          group,
          configured: Boolean(process.env[key]?.trim()),
        })),
        cron: {
          lastRunAt: lastIngest ? lastIngest.startedAt.toISOString() : null,
          lastStatus: lastIngest ? lastIngest.status : null,
          daysSince: lastIngest
            ? Math.floor((Date.now() - lastIngest.startedAt.getTime()) / 86_400_000)
            : null,
        },
        retention: {
          retentionDays: PAGEVIEW_RETENTION_DAYS,
          oldestPageViewAt: oldest ? oldest.toISOString() : null,
          // Self-evidencing: if the oldest row is older than the window, the prune isn't running.
          oldestAgeDays: oldest ? Math.floor((Date.now() - oldest.getTime()) / 86_400_000) : null,
        },
        errors,
        errorsLast7Days,
      },
    });
  } catch (error) {
    console.error("admin system error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load system status" }, { status: 500 });
  }
}
