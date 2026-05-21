import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/subscription/service";

export const runtime = "nodejs";

// Subscription users download directly — unlock is always free.
// This endpoint now just confirms the user has an active subscription.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const sub = await getActiveSubscription(user.id);
  if (!sub) {
    return NextResponse.json({
      ok: true,
      alreadyUnlocked: false,
      needsSubscription: true,
      url: "/pricing",
    });
  }

  return NextResponse.json({ ok: true, alreadyUnlocked: true, purchaseId: null, url: null });
}
