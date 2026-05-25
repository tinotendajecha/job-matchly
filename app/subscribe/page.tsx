'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Loader2, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarket } from '@/hooks/use-market';
import { PLAN_PRICES } from '@/lib/pricing/plans';
import { toast } from 'react-toastify';

const TIER_LABELS: Record<string, string> = { STARTER: 'Starter', PRO: 'Pro', PLUS: 'Plus' };
const TIER_DESCRIPTIONS: Record<string, string> = {
  STARTER: '5 tailors · 5 downloads · PDF only',
  PRO: '20 tailors · 20 downloads · PDF + DOCX',
  PLUS: 'Unlimited tailors · Unlimited downloads · PDF + DOCX',
};

function SubscribePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { market } = useMarket();

  const tier = (params.get('tier') || 'PRO') as 'STARTER' | 'PRO' | 'PLUS';
  const cycle = (params.get('cycle') || 'monthly') as 'monthly' | 'yearly';

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d?.user?.email) setEmail(d.user.email); })
      .catch(() => {});
  }, []);

  const prices = PLAN_PRICES[tier]?.[market ?? 'ZW'];
  const displayPrice = cycle === 'yearly' ? prices?.yearlyMonthlyDisplay : prices?.monthlyDisplay;
  const billedAs = cycle === 'yearly' ? `billed ${prices?.yearlyDisplay} yearly` : 'billed monthly';

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          billingCycle: cycle.toUpperCase(),
          paystackEmail: email,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (res.status === 409) {
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

      // ZW: trial started directly
      toast.success('Your 14-day free trial has started!');
      router.push('/app/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (!TIER_LABELS[tier]) {
    router.replace('/pricing');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
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
              {billedAs} · cancel anytime
            </div>
          </div>

          {/* Trial info */}
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

          {/* What you get */}
          <ul className="space-y-2 mb-6 text-sm">
            {[
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
            onClick={handleStart}
            disabled={loading}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : market === 'ZA' ? (
              <CreditCard className="h-4 w-4 mr-2" />
            ) : null}
            {market === 'ZA' ? 'Continue to card verification' : 'Start my free trial'}
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
