'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, CreditCard, Loader2, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarket } from '@/hooks/use-market';
import { PLAN_PRICES } from '@/lib/pricing/plans';
import { toast } from 'react-toastify';

const TIER_LABELS: Record<string, string> = { STARTER: 'Starter', PRO: 'Pro', PLUS: 'Plus' };
const TIER_RANK: Record<string, number> = { STARTER: 0, PRO: 1, PLUS: 2 };
const TIER_DESCRIPTIONS: Record<string, string> = {
  STARTER: '5 tailors · 5 downloads · PDF only',
  PRO: '20 tailors · 20 downloads · PDF + DOCX',
  PLUS: 'Unlimited tailors · Unlimited downloads · PDF + DOCX',
};

type ExistingSub = {
  tier: 'STARTER' | 'PRO' | 'PLUS';
  status: string;
  market: 'ZW' | 'ZA';
  isActive: boolean;
};

function SubscribePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { market } = useMarket();

  const tier = (params.get('tier') || 'PRO') as 'STARTER' | 'PRO' | 'PLUS';
  const cycle = (params.get('cycle') || 'monthly') as 'monthly' | 'yearly';

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [existingSub, setExistingSub] = useState<ExistingSub | null>(null);
  // True when user has a subscription record but it has expired/been canceled (trial already used).
  const [hasTrialUsed, setHasTrialUsed] = useState(false);

  useEffect(() => {
    // Load user email and check for existing subscription in parallel
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()).catch(() => null),
      fetch('/api/subscription/status').then(r => r.json()).catch(() => null),
    ]).then(([meData, subData]) => {
      if (meData?.user?.email) setEmail(meData.user.email);
      if (subData?.subscription?.isActive) {
        setExistingSub(subData.subscription);
      } else if (subData?.subscription) {
        // Subscription record exists but is not active — trial was already used.
        setHasTrialUsed(true);
      }
    }).finally(() => setCheckingExisting(false));
  }, []);

  if (!TIER_LABELS[tier]) {
    router.replace('/pricing');
    return null;
  }

  const prices = PLAN_PRICES[tier]?.[market ?? 'ZW'];
  const displayPrice = cycle === 'yearly' ? prices?.yearlyMonthlyDisplay : prices?.monthlyDisplay;
  const totalBilled = cycle === 'yearly' ? `billed ${prices?.yearlyDisplay} yearly` : 'billed monthly';

  // Determine mode
  const isAlreadyOnTier = existingSub?.isActive && existingSub.tier === tier;
  const isSameTierTrial = isAlreadyOnTier && existingSub?.status === 'TRIALING';
  // Upgrade mode = has active sub AND (different tier OR same tier on trial wanting to convert)
  const isUpgradeMode = (existingSub?.isActive && (!isAlreadyOnTier || isSameTierTrial)) || hasTrialUsed;
  const isDowngrade = isUpgradeMode && existingSub && !isSameTierTrial && TIER_RANK[tier] < TIER_RANK[existingSub.tier];

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billingCycle: cycle.toUpperCase(), paystackEmail: email }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (res.status === 409) {
          if (data.code === 'TRIAL_USED') {
            // Trial already used — flip into subscribe mode
            setHasTrialUsed(true);
            toast.info('Your free trial has already been used. Please subscribe to continue.');
            return;
          }
          toast.info('You already have an active subscription.');
          router.push('/app/billing');
          return;
        }
        throw new Error(data.error || 'Failed to start trial');
      }

      if (data.market === 'ZA' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      toast.success('Your 14-day free trial has started!');
      router.push('/app/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/upgrade-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billingCycle: cycle.toUpperCase(), paystackEmail: email }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to initiate upgrade');

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      toast.success('Upgrade initiated');
      router.push('/app/billing');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // Loading existing subscription check
  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  // Same tier — if TRIALING let them convert to paid; if ACTIVE redirect to billing
  if (isAlreadyOnTier) {
    if (existingSub?.status === 'ACTIVE') {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold font-display">
                You're already on the {TIER_LABELS[tier]} plan
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your subscription, usage, and billing from your billing page.
              </p>
              <Button asChild className="w-full">
                <Link href="/app/billing">Go to billing</Link>
              </Button>
              <Link href="/pricing" className="block text-xs text-muted-foreground hover:underline">
                ← Compare plans
              </Link>
            </div>
          </main>
        </div>
      );
    }
    // TRIALING on same tier → fall through to upgrade UI so they can convert to paid
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Upgrade context badge */}
          {isUpgradeMode && (existingSub || hasTrialUsed) && (
            <div className="flex items-center justify-center gap-2 mb-5 text-sm text-muted-foreground">
              {hasTrialUsed && !existingSub ? (
                <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                  Trial ended — subscribing now
                </Badge>
              ) : isSameTierTrial ? (
                <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-500">
                  Converting free trial to paid
                </Badge>
              ) : (
                <>
                  <Badge variant="outline" className="text-xs">{TIER_LABELS[existingSub!.tier]}</Badge>
                  <ArrowRight className="h-3.5 w-3.5" />
                  <Badge variant="outline" className={cn('text-xs', isDowngrade ? 'border-amber-500/40 text-amber-500' : 'border-primary/40 text-primary')}>
                    {TIER_LABELS[tier]}
                  </Badge>
                  <span className="text-xs">{isDowngrade ? 'Downgrade' : 'Upgrade'}</span>
                </>
              )}
            </div>
          )}

          {/* Plan summary */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-display">
                    Jobmatchly {TIER_LABELS[tier]}
                  </h1>
                  {tier === 'PRO' && (
                    <Badge className="text-[10px] bg-primary text-primary-foreground">
                      <Zap className="h-2.5 w-2.5 mr-0.5" />
                      Popular
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{TIER_DESCRIPTIONS[tier]}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{displayPrice}</div>
                <div className="text-xs text-muted-foreground">/mo</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground border-t border-border/60 pt-3">
              {totalBilled} · cancel anytime
            </div>
          </div>

          {/* Info box — different for trial vs upgrade vs subscribe-after-trial */}
          {isUpgradeMode ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6 flex gap-3">
              <CreditCard className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary">
                  {hasTrialUsed && !existingSub
                    ? `Subscribe to ${TIER_LABELS[tier]} — starts today`
                    : isSameTierTrial
                    ? `Subscribe to ${TIER_LABELS[tier]} — starts today`
                    : isDowngrade ? 'Switching plan' : 'Upgrade now — pay today'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasTrialUsed && !existingSub
                    ? (market === 'ZA'
                        ? `You'll be charged ${displayPrice} today. Your ${TIER_LABELS[tier]} subscription starts immediately.`
                        : `You'll complete a payment of ${displayPrice}. Your ${TIER_LABELS[tier]} subscription starts as soon as payment is confirmed.`)
                    : isSameTierTrial
                    ? (market === 'ZA'
                        ? `You'll be charged ${displayPrice} today. Your free trial ends and a paid ${TIER_LABELS[tier]} subscription starts immediately.`
                        : `You'll complete a payment of ${displayPrice}. Your paid ${TIER_LABELS[tier]} subscription starts as soon as payment is confirmed.`)
                    : (market === 'ZA'
                        ? `You'll be charged ${displayPrice} today. Your ${TIER_LABELS[tier]} plan activates immediately and replaces your current subscription.`
                        : `You'll complete a payment of ${displayPrice}. Your ${TIER_LABELS[tier]} plan activates as soon as payment is confirmed.`)}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-6 flex gap-3">
              <Shield className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-400">14-day free trial</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {market === 'ZA'
                    ? "We'll verify your card with a R1 charge (refunded). You won't be billed for 14 days."
                    : "No card required. Full access for 14 days, then pay to continue."}
                </p>
              </div>
            </div>
          )}

          {/* Feature list */}
          <ul className="space-y-2 mb-6 text-sm">
            {isUpgradeMode ? ((hasTrialUsed && !existingSub) || isSameTierTrial ? [
              `Full access to ${TIER_LABELS[tier]} features`,
              'Your documents and work are preserved',
              'Billing starts from today',
              'Cancel anytime',
            ] : [
              `All ${TIER_LABELS[tier]} features activated immediately`,
              'Your documents and settings are preserved',
              'Billing resets from today',
              'Cancel anytime',
            ]).map((item) => (
              <li key={item} className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                {item}
              </li>
            )) : [
              'Full access during your trial',
              'No commitment — cancel before day 14',
              'All features unlocked for your plan',
              'Documents saved permanently',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Button
            onClick={isUpgradeMode ? handleUpgrade : handleStart}
            disabled={loading}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            {isUpgradeMode
              ? (hasTrialUsed && !existingSub)
                ? (market === 'ZA' ? `Pay ${displayPrice} · Subscribe to ${TIER_LABELS[tier]}` : `Pay & Subscribe to ${TIER_LABELS[tier]}`)
                : isSameTierTrial
                ? (market === 'ZA' ? `Pay ${displayPrice} · Subscribe to ${TIER_LABELS[tier]}` : `Pay & Subscribe to ${TIER_LABELS[tier]}`)
                : (market === 'ZA' ? `Pay ${displayPrice} · Upgrade now` : `Pay & Upgrade to ${TIER_LABELS[tier]}`)
              : (market === 'ZA' ? 'Continue to card verification' : 'Start my free trial')}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            By continuing you agree to our{' '}
            <Link href="/terms" className="underline underline-offset-2">
              Terms & Privacy
            </Link>
            .
          </p>

          <div className="text-center mt-4">
            <Link href="/pricing" className="text-xs text-muted-foreground hover:underline">
              ← Back to pricing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense>
      <SubscribePageContent />
    </Suspense>
  );
}
