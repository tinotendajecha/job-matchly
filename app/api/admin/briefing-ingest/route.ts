// app/api/admin/briefing-ingest/route.ts
// Runs the briefing pipeline over HTTP. Auth is a bearer CRON_SECRET (not a user session) —
// this is meant to be hit by Vercel Cron, not the browser.
import { NextResponse } from "next/server";
import { runPipeline } from "@/data/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPipeline();
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("briefing-ingest error", err);
    return NextResponse.json({ ok: false, error: "Pipeline failed" }, { status: 500 });
  }
}

// Vercel Cron sends GET requests by default.
export async function GET(req: Request) {
  return POST(req);
}
