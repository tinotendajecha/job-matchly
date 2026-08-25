// app/api/admin/broadcast/[id]/retry/route.ts
// Re-sends one broadcast to just the recipients whose delivery failed, so a
// partial failure doesn't force a full re-send (which would double-mail
// everyone who already received it).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../../middleware";
import { isSendableEmail } from "@/lib/admin/userFilter";
import { sendBroadcastBatch, type BroadcastStyle } from "@/lib/mail";
import { buildUnsubscribeUrl } from "@/lib/unsubscribeToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const broadcast = await prisma.emailBroadcast.findUnique({ where: { id: params.id } });
    if (!broadcast) {
      return NextResponse.json({ ok: false, error: "Broadcast not found" }, { status: 404 });
    }

    const failed = await prisma.emailDelivery.findMany({
      where: { broadcastId: broadcast.id, accepted: false },
    });

    // Addresses the provider will reject are dropped rather than retried forever.
    const retryable = failed.filter((d) => isSendableEmail(d.email));
    const unsendable = failed.length - retryable.length;

    if (retryable.length === 0) {
      return NextResponse.json({
        ok: true,
        retried: 0,
        sent: 0,
        stillFailed: 0,
        unsendable,
        message: unsendable
          ? `Nothing to retry — all ${unsendable} remaining address(es) are invalid.`
          : "Nothing to retry.",
      });
    }

    const results = await sendBroadcastBatch(
      retryable.map((d) => ({
        email: d.email,
        userId: d.userId ?? undefined,
        unsubscribeUrl: d.userId ? buildUnsubscribeUrl(d.userId) : undefined,
      })),
      broadcast.subject,
      broadcast.body,
      (broadcast.style as BroadcastStyle) ?? "PERSONAL"
    );

    const byEmail = new Map(results.map((r) => [r.email, r]));
    await Promise.all(
      retryable.map((d) => {
        const r = byEmail.get(d.email);
        if (!r) return Promise.resolve(null);
        return prisma.emailDelivery.update({
          where: { id: d.id },
          data: { resendId: r.resendId, accepted: r.accepted, error: r.error ?? null },
        });
      })
    );

    const [accepted, total] = [
      await prisma.emailDelivery.count({ where: { broadcastId: broadcast.id, accepted: true } }),
      await prisma.emailDelivery.count({ where: { broadcastId: broadcast.id } }),
    ];

    await prisma.emailBroadcast.update({
      where: { id: broadcast.id },
      data: {
        sentCount: accepted,
        failedCount: total - accepted,
        status: accepted === 0 ? "FAILED" : "COMPLETED",
      },
    });

    const sent = results.filter((r) => r.accepted).length;
    return NextResponse.json({
      ok: true,
      retried: retryable.length,
      sent,
      stillFailed: retryable.length - sent,
      unsendable,
    });
  } catch (error) {
    console.error("broadcast retry error:", error);
    return NextResponse.json({ ok: false, error: "Retry failed" }, { status: 500 });
  }
}
