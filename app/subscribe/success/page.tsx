'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TIER_LABELS: Record<string, string> = { STARTER: 'Starter', PRO: 'Pro', PLUS: 'Plus' };

function SubscribeSuccessPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get('reference');
  const tier = params.get('tier') || 'PRO';
  const cycle = params.get('cycle') || 'monthly';
  const mode = params.get('mode'); // 'upgrade' | 'upgrade-zw' | null (= new trial)
  const ran = useRef(false);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const isUpgrade = mode === 'upgrade' || mode === 'upgrade-zw';
  const tierLabel = TIER_LABELS[tier] ?? tier;

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // ZW upgrade: webhook fires before Pesepay redirects here, so verify by
    // checking whether the subscription actually changed to the expected tier.
    if (mode === 'upgrade-zw') {
      (async () => {
        try {
          const subRes = await fetch('/api/subscription/status');
          const subData = await subRes.json();
          const sub = subData?.subscription;
          if (sub?.tier === tier && sub?.status === 'ACTIVE') {
            setStatus('success');
            setTimeout(() => router.push('/app/billing'), 2500);
          } else {
            setErrorMsg('Payment was cancelled or not completed. Your subscription has not changed.');
            setStatus('error');
          }
        } catch {
          setErrorMsg('Could not verify payment status. Please check your billing page.');
          setStatus('error');
        }
      })();
      return;
    }

    if (!reference) {
      setErrorMsg('Missing payment reference');
      setStatus('error');
      return;
    }

    async function verify() {
      try {
        const endpoint = mode === 'upgrade'
          ? '/api/subscription/verify-upgrade'
          : '/api/subscription/verify-tokenize';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, tier, billingCycle: cycle.toUpperCase() }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Verification failed');

        setStatus('success');
        setTimeout(() => router.push(isUpgrade ? '/app/billing' : '/app/dashboard'), 2500);
      } catch (err: any) {
        setErrorMsg(err.message || 'Something went wrong');
        setStatus('error');
      }
    }

    verify();
  }, [reference, tier, cycle, mode, router, isUpgrade]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">
          {isUpgrade ? 'Activating your subscription…' : 'Activating your trial…'}
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4 text-center px-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        <h1 className="text-2xl font-bold font-display">
          {isUpgrade ? `Upgraded to ${tierLabel}!` : 'Trial activated!'}
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          {isUpgrade
            ? `Your ${tierLabel} subscription is now active. You'll be redirected to billing shortly.`
            : 'Your 14-day free trial is now active. You\'ll be redirected to the app shortly.'}
        </p>
      </div>
    );
  }

  const isCancelled = errorMsg.toLowerCase().includes('cancel') || errorMsg.toLowerCase().includes('not completed');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4 text-center px-4">
      <XCircle className={cn('h-12 w-12', isCancelled ? 'text-muted-foreground' : 'text-destructive')} />
      <h1 className="text-2xl font-bold font-display">
        {isCancelled ? 'Payment cancelled' : isUpgrade ? 'Upgrade failed' : 'Activation failed'}
      </h1>
      <p className="text-muted-foreground text-sm max-w-sm">
        {isCancelled
          ? 'No charge was made. Your subscription has not changed.'
          : errorMsg}
      </p>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/pricing">View plans</Link>
        </Button>
        <Button asChild>
          <Link href="/app/billing">Go to billing</Link>
        </Button>
      </div>
    </div>
  );
}

export default function SubscribeSuccessPage() {
  return (
    <Suspense>
      <SubscribeSuccessPageContent />
    </Suspense>
  );
}
