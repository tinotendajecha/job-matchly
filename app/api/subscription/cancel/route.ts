import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { getUserSubscription, cancelSubscription } from '@/lib/subscription/service';
import { disablePaystackSubscription } from '@/lib/payments/providers/paystack';

export const runtime = 'nodejs';

export async function POST() {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  try {
    const sub = await getUserSubscription(user.id);
    if (!sub) {
      return NextResponse.json({ ok: false, error: 'No active subscription' }, { status: 404 });
    }

    if (sub.cancelAtPeriodEnd) {
      return NextResponse.json({
        ok: true,
        message: 'Already scheduled for cancellation',
        currentPeriodEnd: sub.currentPeriodEnd,
      });
    }

    // For ZA: disable the scheduled Paystack subscription so they won't be charged on day 15
    if (
      sub.market === 'ZA' &&
      sub.paystackSubscriptionCode &&
      sub.paystackEmailToken
    ) {
      try {
        await disablePaystackSubscription(sub.paystackSubscriptionCode, sub.paystackEmailToken);
      } catch (err) {
        // Log but don't fail — still mark canceled locally
        console.error('Paystack subscription disable failed:', err);
      }
    }

    await cancelSubscription(user.id);

    return NextResponse.json({
      ok: true,
      message: 'Subscription will cancel at end of current period',
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Cancel failed' }, { status: 500 });
  }
}
