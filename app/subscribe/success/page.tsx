'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SubscribeSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const reference = params.get('reference');
  const tier = params.get('tier') || 'PRO';
  const cycle = params.get('cycle') || 'monthly';
  const ran = useRef(false);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!reference || ran.current) return;
    ran.current = true;

    async function verify() {
      try {
        const res = await fetch('/api/subscription/verify-tokenize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, tier, billingCycle: cycle.toUpperCase() }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Verification failed');
        setStatus('success');
        setTimeout(() => router.push('/app/dashboard'), 2000);
      } catch (err: any) {
        setErrorMsg(err.message || 'Something went wrong');
        setStatus('error');
      }
    }

    verify();
  }, [reference, tier, cycle, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Activating your trial…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4 text-center px-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        <h1 className="text-2xl font-bold font-display">Trial activated!</h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          Your 14-day free trial is now active. You'll be redirected to the app shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4 text-center px-4">
      <XCircle className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold font-display">Activation failed</h1>
      <p className="text-muted-foreground text-sm max-w-sm">{errorMsg}</p>
      <Button asChild variant="outline">
        <Link href="/pricing">Back to pricing</Link>
      </Button>
    </div>
  );
}
