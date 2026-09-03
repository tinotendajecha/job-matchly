import type { SubscriptionTier } from '@prisma/client';

/**
 * Tailors a signed-out-of-billing user gets before subscribing. Lifetime, not
 * monthly — enough to see that the tool works, not enough to live on.
 *
 * Existing users all start from zero rather than being backfilled from past
 * usage: 53 of 195 had already tailored for free, and cutting them off with no
 * notice costs more than the one-time spend of letting them each have one.
 */
export const FREE_TAILOR_LIFETIME_LIMIT = 1;

export const PLAN_LIMITS = {
  STARTER: {
    tailorsPerMonth: 5,
    downloadsPerMonth: 5,
    coverLettersPerMonth: 2,
    docxDownloads: false,
    allTemplates: false,
  },
  PRO: {
    tailorsPerMonth: 20,
    downloadsPerMonth: 20,
    coverLettersPerMonth: 10,
    docxDownloads: true,
    allTemplates: true,
  },
  PLUS: {
    tailorsPerMonth: null,
    downloadsPerMonth: null,
    coverLettersPerMonth: null,
    docxDownloads: true,
    allTemplates: true,
  },
} as const satisfies Record<SubscriptionTier, {
  tailorsPerMonth: number | null;
  downloadsPerMonth: number | null;
  coverLettersPerMonth: number | null;
  docxDownloads: boolean;
  allTemplates: boolean;
}>;

// Prices in minor units (cents / kobo / ngwe)
export const PLAN_PRICES = {
  STARTER: {
    ZW: { monthly: 299, yearly: 2499, currency: 'USD', monthlyDisplay: '$2.99', yearlyDisplay: '$24.99', yearlyMonthlyDisplay: '$2.08' },
    ZA: { monthly: 4900, yearly: 39900, currency: 'ZAR', monthlyDisplay: 'R49', yearlyDisplay: 'R399', yearlyMonthlyDisplay: 'R33' },
  },
  PRO: {
    ZW: { monthly: 699, yearly: 5599, currency: 'USD', monthlyDisplay: '$6.99', yearlyDisplay: '$55.99', yearlyMonthlyDisplay: '$4.67' },
    ZA: { monthly: 12900, yearly: 99900, currency: 'ZAR', monthlyDisplay: 'R129', yearlyDisplay: 'R999', yearlyMonthlyDisplay: 'R83' },
  },
  PLUS: {
    ZW: { monthly: 1299, yearly: 9999, currency: 'USD', monthlyDisplay: '$12.99', yearlyDisplay: '$99.99', yearlyMonthlyDisplay: '$8.33' },
    ZA: { monthly: 24900, yearly: 199900, currency: 'ZAR', monthlyDisplay: 'R249', yearlyDisplay: 'R1,999', yearlyMonthlyDisplay: 'R167' },
  },
} as const;

export type PlanMarket = 'ZW' | 'ZA';
export type BillingCycleKey = 'monthly' | 'yearly';

export function getPlanPrice(tier: SubscriptionTier, market: PlanMarket, cycle: BillingCycleKey) {
  return PLAN_PRICES[tier][market][cycle];
}

export function getPlanPriceDisplay(tier: SubscriptionTier, market: PlanMarket, cycle: BillingCycleKey) {
  const prices = PLAN_PRICES[tier][market];
  return cycle === 'yearly' ? prices.yearlyMonthlyDisplay : prices.monthlyDisplay;
}

export function getPlanLimits(tier: SubscriptionTier) {
  return PLAN_LIMITS[tier];
}

export const TRIAL_DAYS = 14;

// Paystack R1 tokenization charge (refunded) — minor units
export const PAYSTACK_TOKENIZE_AMOUNT_MINOR = 100;
