import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extendSubscriptionPeriod, getNextPeriodEnd } from '@/lib/subscription/service';
import { parsePesePayWebhook } from '@/lib/payments/service';

export const runtime = 'nodejs';

// Receives Pesepay result callbacks for ZW subscription renewals
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const ref = url.searchParams.get('ref');

    if (!userId || !ref) {
      return NextResponse.json({ ok: false, error: 'Missing params' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const event = parsePesePayWebhook(body);

    if (event.status !== 'PAID') {
      return NextResponse.json({ ok: true, status: event.status });
    }

    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub || sub.lastPesepayRef !== ref) {
      return NextResponse.json({ ok: false, error: 'Subscription not found or ref mismatch' }, { status: 404 });
    }

    const now = new Date();
    const newPeriodEnd = getNextPeriodEnd(
      sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now,
      sub.billingCycle,
    );

    await extendSubscriptionPeriod(userId, newPeriodEnd, 'ACTIVE');

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('pesepay subscription webhook error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Webhook error' }, { status: 500 });
  }
}
