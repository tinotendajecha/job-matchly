import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extendSubscriptionPeriod, getNextPeriodEnd } from '@/lib/subscription/service';
import { parsePesePayWebhook } from '@/lib/payments/service';
import type { BillingCycle, SubscriptionTier } from '@prisma/client';

export const runtime = 'nodejs';

// Receives Pesepay result callbacks for ZW subscription renewals and upgrades
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const ref = url.searchParams.get('ref');
    const mode = url.searchParams.get('mode'); // 'upgrade' for upgrade payments
    const upgradeTier = url.searchParams.get('tier') as SubscriptionTier | null;
    const upgradeCycle = url.searchParams.get('cycle') as BillingCycle | null;

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

    if (mode === 'upgrade' && upgradeTier && upgradeCycle) {
      // Upgrade: change tier + activate immediately
      const newPeriodEnd = getNextPeriodEnd(now, upgradeCycle);
      await prisma.subscription.update({
        where: { userId },
        data: {
          tier: upgradeTier,
          billingCycle: upgradeCycle,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: newPeriodEnd,
          trialEndsAt: null,
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });
    } else {
      // Renewal: extend the current period
      const newPeriodEnd = getNextPeriodEnd(
        sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now,
        sub.billingCycle,
      );
      await extendSubscriptionPeriod(userId, newPeriodEnd, 'ACTIVE');
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('pesepay subscription webhook error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Webhook error' }, { status: 500 });
  }
}
