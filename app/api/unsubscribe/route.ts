// app/api/unsubscribe/route.ts
// Public, no auth: opt-out link carried in broadcast emails.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribeToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page(title: string, message: string) {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title} — JobMatchly</title>
  </head>
  <body style="margin:0;background:#f8fafc;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:520px;margin:64px auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
      <div style="height:6px;background:#A4FF3C;"></div>
      <div style="padding:28px;">
        <div style="display:inline-block;padding:10px 12px;background:#A4FF3C;border-radius:12px;font-weight:700;color:#000;font-size:14px;">JobMatchly</div>
        <h1 style="margin:20px 0 8px 0;font-size:20px;color:#0f172a;">${title}</h1>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">${message}</p>
      </div>
    </div>
  </body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const uid = url.searchParams.get("uid") || "";
  const token = url.searchParams.get("token") || "";

  if (!uid || !token || !verifyUnsubscribeToken(uid, token)) {
    return page("Invalid link", "This unsubscribe link isn't valid. Please use the link from a recent email.");
  }

  try {
    await prisma.user.update({ where: { id: uid }, data: { marketingOptOut: true } });
  } catch (e) {
    console.error("unsubscribe failed:", e);
    return page("Something went wrong", "We couldn't process that just now. Please try again shortly.");
  }

  return page(
    "You're unsubscribed",
    "You won't receive any more announcement or update emails from JobMatchly. Account emails like password resets and email verification will still be sent."
  );
}
