// app/api/admin/broadcast/[id]/deliveries/route.ts
// Per-recipient delivery status for one broadcast, refreshed from Resend so
// "did it actually arrive" is answered by the provider, not assumed.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../../middleware";
import { fetchResendEvent } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cap the provider lookups so a huge broadcast can't blow the function timeout.
const MAX_REFRESH = 60;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const refresh = new URL(request.url).searchParams.get("refresh") === "1";

    const deliveries = await prisma.emailDelivery.findMany({
      where: { broadcastId: params.id },
      orderBy: { createdAt: "asc" },
    });

    if (refresh) {
      const refreshable = deliveries.filter((d) => d.resendId).slice(0, MAX_REFRESH);
      const events = await Promise.all(refreshable.map((d) => fetchResendEvent(d.resendId as string)));

      await Promise.all(
        refreshable.map((d, i) =>
          events[i] && events[i] !== d.lastEvent
            ? prisma.emailDelivery.update({ where: { id: d.id }, data: { lastEvent: events[i] } })
            : Promise.resolve(null)
        )
      );

      refreshable.forEach((d, i) => {
        if (events[i]) d.lastEvent = events[i];
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        deliveries: deliveries.map((d) => ({
          id: d.id,
          email: d.email,
          accepted: d.accepted,
          lastEvent: d.lastEvent,
          error: d.error,
        })),
      },
    });
  } catch (error) {
    console.error("broadcast deliveries error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load delivery status" }, { status: 500 });
  }
}
