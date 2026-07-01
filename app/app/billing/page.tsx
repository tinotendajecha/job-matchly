'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { differenceInDays, format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Calendar, CheckCircle2, CreditCard, Loader2, RefreshCw, Zap } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PLAN_LIMITS } from '@/lib/pricing/plans';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type SubscriptionData = {
  tier: 'STARTER' | 'PRO' | 'PLUS';
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  billingCycle: 'MONTHLY' | 'YEARLY';
  market: 'ZW' | 'ZA';
  trialEndsAt: string | null;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  isActive: boolean;
};

type UsageData = {
  tailor: { count: number; limit: number | null };
  download: { count: number; limit: number | null };
  cover_letter: { count: number; limit: number | null };
};

const TIER_LABELS = { STARTER: 'Starter', PRO: 'Pro', PLUS: 'Plus' };
const STATUS_LABELS: Record<string, string> = {
  TRIALING: 'Free trial',
  ACTIVE: 'Active',
  PAST_DUE: 'Past due',
  CANCELED: 'Canceled',
  EXPIRED: 'Expired',
};

function UsageBar({ label, count, limit }: { label: string; count: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((count / limit) * 100));
  const isUnlimited = limit === null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-foreground/80">{label}</span>
        <span className="text-xs text-muted-foreground">
          {isUnlimited ? `${count} used` : `${count} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={pct}
          className={cn('h-1.5', pct >= 90 ? '[&>div]:bg-amber-400' : '[&>div]:bg-primary')}
        />
      )}
      {isUnlimited && (
        <div className="text-xs text-emerald-400 font-medium">Unlimited</div>
      )}
    </div>
  );
}

function BillingPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    if (searchParams.get('renewed') === '1') {
      toast.success('Subscription renewed successfully!');
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/subscription/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setSub(data.subscription);
          setUsage(data.usage);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel() {
    setCanceling(true);
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Cancel failed');
      setSub((prev) => prev ? { ...prev, cancelAtPeriodEnd: true } : prev);
      toast.success('Subscription will cancel at end of period.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    } finally {
      setCanceling(false);
    }
  }

  async function handleRenew() {
    setRenewing(true);
    try {
      const res = await fetch('/api/subscription/renew', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Renewal failed');
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      toast.error(err.message || 'Renewal failed');
      setRenewing(false);
    }
  }

  const trialDaysLeft = sub?.trialEndsAt
    ? Math.max(0, differenceInDays(new Date(sub.trialEndsAt), new Date()))
    : null;

  const limits = sub ? PLAN_LIMITS[sub.tier] : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-3xl mx-auto space-y-6">

            {/* Page header */}
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight">Billing & Subscription</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage your plan and usage</p>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : !sub || !sub.isActive ? (
              /* No active subscription */
              <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">
                  {sub ? 'Your subscription has ended' : 'No active subscription'}
                </h2>
                <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                  {sub
                    ? 'Choose a plan to continue tailoring resumes, generating cover letters, and downloading your documents.'
                    : 'Start a free 14-day trial to tailor resumes, generate cover letters, and download your documents.'}
                </p>
                <Button asChild size="lg">
                  <Link href="/pricing">View plans</Link>
                </Button>
                {sub?.market === 'ZW' && (sub?.status === 'EXPIRED' || sub?.status === 'PAST_DUE') && (
                  <div className="mt-4">
                    <Button variant="outline" onClick={handleRenew} disabled={renewing}>
                      {renewing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renew with Pesepay
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Subscription card */}
                <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
                  <div className="flex flex-wrap items-start gap-3 justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold font-display">
                          Jobmatchly {TIER_LABELS[sub.tier]}
                        </h2>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs border-0',
                            sub.status === 'TRIALING' && 'bg-blue-500/15 text-blue-400',
                            sub.status === 'ACTIVE' && 'bg-emerald-500/15 text-emerald-400',
                            sub.status === 'PAST_DUE' && 'bg-amber-500/15 text-amber-400',
                          )}
                        >
                          {STATUS_LABELS[sub.status] || sub.status}
                        </Badge>
                        {sub.cancelAtPeriodEnd && (
                          <Badge variant="outline" className="text-xs border-0 bg-destructive/10 text-destructive">
                            Cancels {format(new Date(sub.currentPeriodEnd), 'dd MMM yyyy')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {sub.billingCycle === 'YEARLY' ? 'Yearly billing' : 'Monthly billing'}
                        {' · '}
                        {sub.market === 'ZA' ? 'Auto-renews via Paystack' : 'Manual renewal via Pesepay'}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/pricing`}>
                        <Zap className="h-3.5 w-3.5 mr-1.5" />
                        Upgrade
                      </Link>
                    </Button>
                  </div>

                  {/* Trial countdown */}
                  {sub.status === 'TRIALING' && trialDaysLeft !== null && (
                    <div className={cn(
                      'rounded-lg px-4 py-3 flex items-start justify-between gap-3',
                      trialDaysLeft <= 3
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'bg-blue-500/10 border border-blue-500/20',
                    )}>
                      <div className="flex items-start gap-3 flex-1">
                        {trialDaysLeft <= 3
                          ? <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          : <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        }
                        <div>
                          <p className={cn('text-sm font-medium', trialDaysLeft <= 3 ? 'text-amber-400' : 'text-blue-400')}>
                            {trialDaysLeft === 0
                              ? 'Trial ends today'
                              : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Trial ends {format(new Date(sub.trialEndsAt!), 'dd MMM yyyy')} · Subscribe to keep access.
                          </p>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="default" className="flex-shrink-0 text-xs h-8">
                        <Link href="/pricing">Upgrade plan</Link>
                      </Button>
                    </div>
                  )}

                  {/* Period info */}
                  {sub.status === 'ACTIVE' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>
                        Renews {formatDistanceToNow(new Date(sub.currentPeriodEnd), { addSuffix: true })}
                        {' '}({format(new Date(sub.currentPeriodEnd), 'dd MMM yyyy')})
                      </span>
                    </div>
                  )}

                  {/* ZW renew button */}
                  {sub.market === 'ZW' && (sub.status === 'TRIALING' || sub.status === 'ACTIVE') && (
                    <div className="pt-1">
                      <p className="text-xs text-muted-foreground mb-2">
                        ZW subscriptions require manual renewal. You'll receive reminders before expiry.
                      </p>
                    </div>
                  )}

                  {/* Cancel */}
                  {!sub.cancelAtPeriodEnd && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive text-xs p-0 h-auto">
                          Cancel subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You'll keep access until{' '}
                          <strong>{format(new Date(sub.currentPeriodEnd), 'dd MMM yyyy')}</strong>.
                          After that, your account will downgrade and you won't be able to tailor or download.
                        </AlertDialogDescription>
                        <div className="flex gap-3 justify-end">
                          <AlertDialogCancel>Keep subscription</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancel}
                            disabled={canceling}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {canceling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Yes, cancel
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Usage */}
                {usage && limits && (
                  <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">This month's usage</h3>
                      {sub.tier !== 'PLUS' && (
                        <Button asChild variant="outline" size="sm" className="text-xs h-7 px-3">
                          <Link href="/pricing">
                            <Zap className="h-3 w-3 mr-1" />
                            Upgrade
                          </Link>
                        </Button>
                      )}
                    </div>
                    <UsageBar
                      label="Resume tailors"
                      count={usage.tailor.count}
                      limit={usage.tailor.limit}
                    />
                    <UsageBar
                      label="Downloads"
                      count={usage.download.count}
                      limit={usage.download.limit}
                    />
                    <UsageBar
                      label="Cover letters"
                      count={usage.cover_letter.count}
                      limit={usage.cover_letter.limit}
                    />
                    <p className="text-xs text-muted-foreground">
                      Resets on the 1st of each month.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingPageContent />
    </Suspense>
  );
}
