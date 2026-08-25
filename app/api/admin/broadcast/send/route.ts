// app/api/admin/broadcast/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../middleware";
import { buildUserFilterWhere } from "@/lib/admin/userFilter";
import { sendBroadcastBatch, sendSingleBroadcastEmail } from "@/lib/mail";
import { buildUnsubscribeUrl } from "@/lib/unsubscribeToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BodySchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20000),
  filter: z
    .object({
      search: z.string().optional(),
      status: z.string().optional(),
      accountType: z.string().optional(),
    })
    .optional()
    .default({}),
  testEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const admin = authResult;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Subject and message are required." }, { status: 400 });
  }
  const { subject, body, filter, testEmail } = parsed.data;

  // Test send: one address, no audience query, no broadcast record.
  // Uses the admin's own unsubscribe link so the preview matches what real
  // recipients see, and so a missing signing secret fails here, not mid-send.
  if (testEmail) {
    try {
      await sendSingleBroadcastEmail(testEmail, subject, body, {
        name: admin.name,
        unsubscribeUrl: buildUnsubscribeUrl(admin.id),
      });
      return NextResponse.json({ ok: true, test: true, sentTo: testEmail });
    } catch (e) {
      console.error("broadcast test send failed:", e);
      return NextResponse.json(
        { ok: false, error: `Test email failed: ${(e as Error)?.message || "unknown error"}` },
        { status: 500 }
      );
    }
  }

  try {
    const where = buildUserFilterWhere(filter, { emailableOnly: true });
    const audience = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true },
    });

    if (audience.length === 0) {
      return NextResponse.json({ ok: false, error: "No recipients match this audience." }, { status: 400 });
    }

    const broadcast = await prisma.emailBroadcast.create({
      data: {
        subject,
        body,
        audienceFilter: filter,
        recipientCount: audience.length,
        status: "SENDING",
        sentByEmail: admin.email || "unknown",
      },
    });

    const results = await sendBroadcastBatch(
      audience.map((u) => ({
        email: u.email as string,
        name: u.name,
        userId: u.id,
        unsubscribeUrl: buildUnsubscribeUrl(u.id),
      })),
      subject,
      body
    );

    await prisma.emailDelivery.createMany({
      data: results.map((r) => ({
        broadcastId: broadcast.id,
        email: r.email,
        userId: r.userId,
        resendId: r.resendId,
        accepted: r.accepted,
        error: r.error,
      })),
    });

    const sent = results.filter((r) => r.accepted).length;
    const failed = results.length - sent;
    const firstError = results.find((r) => r.error)?.error;

    await prisma.emailBroadcast.update({
      where: { id: broadcast.id },
      data: {
        sentCount: sent,
        failedCount: failed,
        status: sent === 0 ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      test: false,
      broadcastId: broadcast.id,
      recipientCount: audience.length,
      sent,
      failed,
      error: sent === 0 ? firstError : undefined,
    });
  } catch (error) {
    console.error("broadcast/send error:", error);
    return NextResponse.json({ ok: false, error: "Failed to send broadcast." }, { status: 500 });
  }
}
