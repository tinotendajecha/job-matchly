import { NextResponse } from 'next/server';
import { verifyPaystackSignature } from '@/lib/payments/providers/paystack';
import { applyProviderWebhookUpdate } from '@/lib/payments/service';
import { activateSubscriptionFromPaystack, extendSubscriptionPeriod, getNextPeriodEnd, getUserSubscription } from '@/lib/subscription/service';
import { prisma } from '@/lib/prisma';
import type { BillingCycle, SubscriptionTier } from '@prisma/client';
import { toJsonValue } from '@/lib/json';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!verifyPaystackSignature(rawBody, signature)) {
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event: string = payload?.event || '';
    const data = payload?.data || {};

    // --- Subscription lifecycle events ---
    if (event === 'subscription.create') {
      const customerCode = data?.customer?.customer_code;
      const subscriptionCode = data?.subscription_code;
      const planCode = data?.plan?.plan_code;

      if (customerCode && subscriptionCode) {
        await prisma.subscription.updateMany({
          where: { paystackCustomerCode: customerCode },
          data: {
            status: 'ACTIVE',
            paystackSubscriptionCode: subscriptionCode,
            paystackPlanCode: planCode || null,
          },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (event === 'charge.success') {
      const subscriptionCode = data?.subscription_code;
      const authorization = data?.authorization;

      // If this is a subscription charge (not a one-time payment), extend the period
      if (subscriptionCode) {
        const sub = await prisma.subscription.findFirst({
          where: { paystackSubscriptionCode: subscriptionCode },
        });

        if (sub) {
          const now = new Date();
          const newPeriodEnd = getNextPeriodEnd(
            sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now,
            sub.billingCycle,
          );
          await extendSubscriptionPeriod(sub.userId, newPeriodEnd, 'ACTIVE');
        }
        return NextResponse.json({ ok: true });
      }

      // Could be a trial tokenization charge — handle in the callback route, not here
      // Fall through to regular purchase handling
    }

    if (event === 'invoice.payment_failed') {
      const subscriptionCode = data?.subscription?.subscription_code;
      if (subscriptionCode) {
        await prisma.subscription.updateMany({
          where: { paystackSubscriptionCode: subscriptionCode },
          data: { status: 'PAST_DUE' },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (event === 'subscription.disable') {
      const subscriptionCode = data?.subscription_code;
      if (subscriptionCode) {
        await prisma.subscription.updateMany({
          where: { paystackSubscriptionCode: subscriptionCode },
          data: { status: 'CANCELED' },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (event === 'customer.identified') {
      const customerCode = data?.customer_code;
      const email = data?.email;
      if (customerCode && email) {
        const userRecord = await prisma.user.findUnique({ where: { email } });
        if (userRecord) {
          await prisma.subscription.updateMany({
            where: { userId: userRecord.id, paystackCustomerCode: null },
            data: { paystackCustomerCode: customerCode },
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    // --- Legacy one-time purchase webhook ---
    const providerReference = data?.reference;
    if (!providerReference) {
      return NextResponse.json({ ok: true }); // Unrecognised event — acknowledge
    }

    const result = await applyProviderWebhookUpdate({
      providerReference,
      status: data?.status === 'success' ? 'PAID' : data?.status === 'failed' ? 'FAILED' : 'PENDING',
      metadata: { webhookEvent: event },
      raw: toJsonValue(payload),
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('paystack webhook fatal:', error);
    return NextResponse.json({ ok: false, error: error?.message || 'Invalid webhook' }, { status: 400 });
  }
}
