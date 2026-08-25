// app/api/track/pageview/route.ts
//
// The only unauthenticated write endpoint in the app, so the controls matter.
// In order: origin allow-list -> payload cap -> required httpOnly cookie ->
// bot filter -> rate limit -> strict schema. Everything that identifies the
// visit (country, device, market, visitorId) is derived SERVER-SIDE; the body
// cannot set any of it.
//
// Stores no IP address and no userId — that is what keeps these rows anonymous
// and lets this endpoint skip auth entirely (an auth check would mean a Session
// query on every page view).
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveMarket } from "@/lib/market/config";
import { normalizePath, referrerHost } from "@/lib/analytics/normalizePath";
import { isBot, classifyDevice } from "@/lib/analytics/botFilter";
import { rateLimit, underGlobalCap } from "@/lib/analytics/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "jm_vid";
const MAX_BODY_BYTES = 2048;
const PER_VISITOR_PER_MINUTE = 60;

const ALLOWED_HOST_SUFFIXES = ["jobmatchly.site", "jobmatchly.co.za", "vercel.app", "localhost"];

function originAllowed(request: NextRequest): boolean {
  const source = request.headers.get("origin") || request.headers.get("referer");
  if (!source) return false;
  try {
    const host = new URL(source).hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
  } catch {
    return false;
  }
}

const BodySchema = z
  .object({
    path: z.string().min(1).max(2048),
    referrer: z.string().max(2048).nullable().optional(),
  })
  .strict();

/**
 * Always 204, whether or not a row was written. Telling a caller which of the
 * filters rejected them is free reconnaissance.
 */
const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
  try {
    if (!originAllowed(request)) return noContent();

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY_BYTES) return noContent();

    // No cookie means a client that isn't carrying our first-party state.
    // Trade-off: visitors with cookies disabled go uncounted, which is a
    // negligible slice and keeps this endpoint from being a flood vector.
    const visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
    if (!visitorId || visitorId.length > 36) return noContent();

    const userAgent = request.headers.get("user-agent");
    if (isBot(userAgent)) return noContent();

    if (!underGlobalCap()) return noContent();
    if (!rateLimit(`v:${visitorId}`, PER_VISITOR_PER_MINUTE)) return noContent();

    const parsed = BodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return noContent();

    const path = normalizePath(parsed.data.path);
    if (!path) return noContent();

    const host = request.headers.get("host");

    await prisma.pageView.create({
      data: {
        visitorId,
        path,
        referrerHost: referrerHost(parsed.data.referrer, host),
        device: classifyDevice(userAgent),
        country: request.headers.get("x-vercel-ip-country")?.slice(0, 2) || null,
        market: resolveMarket(host),
        dayKey: new Date().toISOString().slice(0, 10),
      },
    });

    return noContent();
  } catch (error) {
    // Telemetry failure must never be visible to the visitor.
    console.error("pageview track error:", error);
    return noContent();
  }
}
