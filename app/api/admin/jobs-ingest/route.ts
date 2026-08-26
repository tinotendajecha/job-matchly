// app/api/admin/jobs-ingest/route.ts
// Daily job refresh. Listings expire within days, so this runs more often than
// the weekly briefing ingest. Auth is a bearer CRON_SECRET, not a user session.
import { NextResponse } from "next/server";
import { runJobsPipeline } from "@/data/jobs/pipeline";
import { tagUsers } from "@/data/jobs/tagUsers";
import { rebuildMatches } from "@/lib/jobs/match";
import { reconcileSubscriptionStatuses } from "@/lib/subscription/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Bring stored subscription status in line with the dates before anything
  // reads it. Own try/catch: an ingest failure must not skip reconciliation.
  let subscriptions = null;
  try {
    subscriptions = await reconcileSubscriptionStatuses();
  } catch (err) {
    console.error("subscription reconcile failed", err);
  }

  try {
    const ingest = await runJobsPipeline("CRON");

    // Tag any newly-active users, then rescore. Both are rules-first, so the
    // marginal AI cost per run is a handful of calls at most.
    const tagging = await tagUsers();
    const matching = await rebuildMatches();

    return NextResponse.json({ ok: true, subscriptions, ingest, tagging, matching });
  } catch (err: any) {
    console.error("jobs-ingest error", err);
    return NextResponse.json({ ok: false, error: "Job ingest failed" }, { status: 500 });
  }
}

// Vercel Cron issues GET.
export async function GET(req: Request) {
  return POST(req);
}
