import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { activateSubscriptionFromPaystack } from '@/lib/subscription/service';
import { getOrCreatePaystackPlan, createPaystackSubscription } from '@/lib/payments/providers/paystack';
import { PLAN_PRICES, TRIAL_DAYS } from '@/lib/pricing/plans';
import { addDays } from 'date-fns';
import type { BillingCycle, SubscriptionTier } from '@prisma/client';

export const runtime = 'nodejs';

type Body = {
  reference: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
};

export async function POST(req: Request) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  try {
    const { reference, tier, billingCycle } = (await req.json()) as Body;

    if (!reference) {
      return NextResponse.json({ ok: false, error: 'Missing reference' }, { status: 400 });
    }

    // 1. Verify the R1 tokenization transaction
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } },
    );
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData?.status) {
      throw new Error(verifyData?.message || 'Paystack verification failed');
    }

    const txData = verifyData?.data;
    if (String(txData?.status || '').toLowerCase() !== 'success') {
      throw new Error('Payment not successful');
    }

    const authCode: string = txData?.authorization?.authorization_code;
    const customerCode: string = txData?.customer?.customer_code;

    if (!authCode || !customerCode) {
      throw new Error('Missing Paystack authorization data');
    }

    // 2. Get or create the Paystack plan for this tier + cycle
    const cycleKey = billingCycle === 'YEARLY' ? 'yearly' : 'monthly';
    const priceData = PLAN_PRICES[tier]?.ZA;
    if (!priceData) throw new Error('Invalid tier');

    const amountMinor = priceData[cycleKey];
    const planCode = await getOrCreatePaystackPlan(tier, billingCycle, amountMinor, 'ZAR');

    // 3. Create the Paystack subscription with start_date = trial end
    //    Paystack will automatically charge on that date — no cron needed
    const trialEndsAt = addDays(new Date(), TRIAL_DAYS);
    const { subscriptionCode, emailToken } = await createPaystackSubscription({
      customerCode,
      planCode,
      authCode,
      startDate: trialEndsAt,
    });

    // 4. Save trial subscription locally
    const sub = await activateSubscriptionFromPaystack({
      userId: user.id,
      tier,
      billingCycle,
      paystackAuthCode: authCode,
      paystackCustomerCode: customerCode,
      paystackSubscriptionCode: subscriptionCode,
      paystackEmailToken: emailToken,
      paystackRef: reference,
    });

    return NextResponse.json({
      ok: true,
      subscription: { tier: sub.tier, status: sub.status, trialEndsAt: sub.trialEndsAt },
    });
  } catch (err: any) {
    console.error('verify-tokenize error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'Verification failed' }, { status: 500 });
  }
}
