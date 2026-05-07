'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { ArrowRight, Calendar, Coins, Copy as CopyIcon, CreditCard, TrendingUp, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarket } from '@/hooks/use-market';
import {
  computeSubtotalUSD,
  pricePerCreditUSD,
  computeSubtotalZAR,
  pricePerCreditZAR,
} from '@/lib/pricing';

const fmtUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtZAR = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Pack = {
  credits: number;
  price: number;
  priceDisplay: string;
  unitPriceDisplay: string;
  popular?: boolean;
};

type HistoryItem = {
  id: string;
  date: string;
  type: 'CREDIT_TOPUP' | 'RESUME_DOWNLOAD_UNLOCK' | 'SYSTEM_BONUS';
  market: 'ZW' | 'ZA';
  provider: string;
  description: string;
  amountMinor: number;
  currency: string;
  status: string;
  documentId: string | null;
  providerRef: string | null;
};

type Me = {
  credits: number;
  name?: string | null;
  market?: 'ZW' | 'ZA';
};

function formatCurrencyAmount(amountMinor: number, currency: string) {
  const locale = currency === 'ZAR' ? 'en-ZA' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { isSouthAfrica } = useMarket();

  const [isChecking, setIsChecking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [customCredits, setCustomCredits] = useState<number>(3);

  const customCreditsRef = useRef<HTMLDivElement>(null);

  const customPricing = useMemo(() => {
    const credits = Math.max(3, Math.floor(customCredits || 3));
    if (isSouthAfrica) {
      const ppc = pricePerCreditZAR(credits);
      const subtotal = computeSubtotalZAR(credits);
      return { credits, ppcDisplay: fmtZAR.format(ppc), subtotalDisplay: fmtZAR.format(subtotal), totalDisplay: fmtZAR.format(subtotal) };
    }
    const ppc = pricePerCreditUSD(credits);
    const subtotal = +computeSubtotalUSD(credits).toFixed(2);
    return { credits, ppcDisplay: fmtUSD.format(ppc), subtotalDisplay: fmtUSD.format(subtotal), totalDisplay: fmtUSD.format(subtotal) };
  }, [customCredits, isSouthAfrica]);

  const packs: Pack[] = [10, 25, 50].map((credits) => {
    if (isSouthAfrica) {
      const price = computeSubtotalZAR(credits);
      const unitPrice = pricePerCreditZAR(credits);
      return { credits, price, priceDisplay: fmtZAR.format(price), unitPriceDisplay: `${fmtZAR.format(unitPrice)}/credit`, popular: credits === 10 };
    }
    const price = computeSubtotalUSD(credits);
    const unitPrice = pricePerCreditUSD(credits);
    return { credits, price, priceDisplay: fmtUSD.format(price), unitPriceDisplay: `${fmtUSD.format(unitPrice)}/credit`, popular: credits === 10 };
  });

  const latestPaid = useMemo(() => history.find((item) => item.status === 'PAID') || null, [history]);

  const pageTitle = isSouthAfrica ? 'Billing & Downloads' : 'Billing & Credits';
  const pageDescription = isSouthAfrica
    ? 'Tailor resumes freely, then pay R25 only when you want to download a tailored resume.'
    : 'Buy credits and track your usage. 1 credit = 1 tailored resume.';
  const promoMessage = isSouthAfrica
    ? 'South Africa pricing: tailored resumes stay visible for free, and each download unlock is R25.'
    : 'Early pricing promotion: get 10 credits for just $3. Prices auto-calculated for other packs.';
  const balanceTitle = isSouthAfrica ? 'Credits for Extras' : 'Credit Balance';
  const balanceHelp = isSouthAfrica ? 'Optional credits for cover letters and add-ons' : 'Credits available';
  const topupTitle = isSouthAfrica ? 'Optional Credit Top-Ups' : 'Buy Credits (USD)';
  const customTitle = isSouthAfrica ? 'Custom Credit Top-Up' : 'Custom Credits';
  const topupFooter = isSouthAfrica
    ? 'Paystack handles checkout for South Africa. Resume downloads are billed separately at R25 each.'
    : 'Card payments supported. Zimbabwe credit top-ups continue to use the existing checkout flow.';

  async function loadMe() {
    const res = await fetch('/api/auth/me', { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    if (!data?.ok) return;
    setMe({ credits: data.user?.credits, name: data.user?.name, market: data.user?.market });
  }

  async function loadHistory() {
    const res = await fetch('/api/billing/history', { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) return;
    const data = await res.json();
    if (!data?.ok) return;
    const items = (data.items as HistoryItem[]).map((item) => ({
      ...item,
      date: new Date(item.date).toISOString().slice(0, 10),
    }));
    setHistory(items);
  }

  useEffect(() => {
    (async () => {
      setIsPageLoading(true);
      await Promise.all([loadMe(), loadHistory()]);
      setIsPageLoading(false);
    })();
  }, []);

  async function startCheckout(credits: number) {
    setIsStarting(true);
    try {
      const res = await fetch('/api/billing/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ credits }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.url) throw new Error(data?.error || 'Failed to initiate checkout');
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error?.message || 'Could not start checkout');
    } finally {
      setIsStarting(false);
    }
  }

  useEffect(() => {
    const purchaseId = searchParams.get('purchase');
    if (!purchaseId) return;
    let cancelled = false;
    (async () => {
      setIsChecking(true);
      try {
        const res = await fetch(`/api/payments/status?purchaseId=${encodeURIComponent(purchaseId)}`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.ok) { toast.error('Could not verify payment status'); return; }
        const status = String(data.status || '').toUpperCase();
        if (status === 'PAID') {
          if (data.purchase?.type === 'RESUME_DOWNLOAD_UNLOCK') {
            toast.success('Payment successful. Your tailored resume is now unlocked.');
          } else {
            toast.success('Payment successful. Credits have been added to your account.');
          }
          await Promise.all([loadMe(), loadHistory()]);
        } else if (status === 'FAILED') {
          toast.error('Payment failed - no charges were applied');
        } else if (status === 'CANCELED') {
          toast.info('Payment was canceled');
        } else {
          toast.info('Payment is still pending. We will refresh once it clears.');
        }
      } catch { toast.error('Status check error'); }
      finally { setIsChecking(false); }
    })();
    return () => { cancelled = true; };
  }, [searchParams]);

  const scrollToCustomCredits = () =>
    customCreditsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const statusMeta = (status: string) => {
    if (status === 'PAID') return { label: 'Paid', cls: 'bg-emerald-500/15 text-emerald-400 border-0' };
    if (status === 'FAILED') return { label: 'Failed', cls: 'bg-red-500/15 text-red-400 border-0' };
    if (status === 'CANCELED') return { label: 'Canceled', cls: 'bg-amber-500/15 text-amber-400 border-0' };
    return { label: 'Pending', cls: 'bg-amber-500/15 text-amber-400 border-0' };
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <AppSidebar />
          <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-6xl mx-auto">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
              <div className="grid gap-6 lg:grid-cols-[1fr_300px] mt-6">
                <div className="space-y-4">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-64 w-full rounded-xl" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-36 w-full rounded-xl" />
                  <Skeleton className="h-64 w-full rounded-xl" />
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <AppSidebar credits={me?.credits} />

        <main className="flex-1 min-w-0 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-6xl mx-auto"
          >
            {/* Page header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold font-display tracking-tight mb-1">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground">{pageDescription}</p>
            </div>

            {/* Promo banner */}
            <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary/90 flex items-center gap-2">
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              {promoMessage}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

              {/* Left: status + usage + history */}
              <div className="space-y-5">

                {/* Current Status */}
                <div className="rounded-xl border border-border/60 bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Current Status</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Latest purchase</p>
                      <p className="text-sm font-medium truncate">
                        {latestPaid
                          ? `${latestPaid.description}`
                          : 'No purchases yet'}
                      </p>
                      {latestPaid && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrencyAmount(latestPaid.amountMinor, latestPaid.currency)} · {latestPaid.date}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground mb-1">{balanceHelp}</p>
                      <p className="text-2xl font-bold text-primary tabular-nums">{me?.credits ?? 0}</p>
                      <p className="text-xs text-muted-foreground">credits remaining</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Completed purchases</p>
                      <p className="text-2xl font-bold tabular-nums">{history.filter((item) => item.status === 'PAID').length}</p>
                      <p className="text-xs text-muted-foreground">total transactions</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/pricing" className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">View Pricing</Button>
                    </Link>
                    <Button size="sm" onClick={scrollToCustomCredits}>
                      {isSouthAfrica ? 'Top Up Credits' : 'Top Up'}
                    </Button>
                  </div>
                </div>

                {/* Usage */}
                <div className="rounded-xl border border-border/60 bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Usage This Month</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">{isSouthAfrica ? 'Credits Used for Extras' : 'Credits Used'}</span>
                        <span className="font-medium">– / –</span>
                      </div>
                      <Progress value={0} className="h-1.5" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Resume builds', value: '–' },
                        { label: 'JD tailoring', value: '–' },
                        { label: 'Cover letters', value: '–' },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-muted/40 px-3 py-2.5 text-center">
                          <div className="text-base font-bold mb-0.5">{stat.value}</div>
                          <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Billing History */}
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/60">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Billing History</h2>
                  </div>

                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <p className="text-sm text-muted-foreground">No purchases yet</p>
                      <Button size="sm" variant="outline" onClick={scrollToCustomCredits}>Buy credits</Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {history.map((row, index) => {
                        const sm = statusMeta(row.status);
                        return (
                          <motion.div
                            key={row.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{row.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {row.date} · {row.provider} · {row.market}
                              </p>
                            </div>
                            <span className="font-mono text-sm font-medium tabular-nums hidden sm:block">
                              {formatCurrencyAmount(row.amountMinor, row.currency)}
                            </span>
                            <Badge variant="outline" className={sm.cls}>
                              {sm.label}
                            </Badge>
                            <Button
                              title="Copy reference"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                              onClick={() => row.providerRef && navigator.clipboard?.writeText(row.providerRef)}
                            >
                              <CopyIcon className="h-3.5 w-3.5" />
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: balance + packs + custom */}
              <div className="space-y-5">

                {/* Balance card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Coins className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{balanceTitle}</h3>
                  </div>
                  <motion.div
                    className="text-4xl font-bold text-primary mb-1 tabular-nums"
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    {me?.credits ?? 0}
                  </motion.div>
                  <p className="text-xs text-muted-foreground mb-4">{balanceHelp}</p>
                  <Button className="w-full" size="sm" onClick={scrollToCustomCredits}>
                    {isSouthAfrica ? 'Buy Credits for Extras' : 'Top Up'}
                  </Button>
                </motion.div>

                {/* Packs */}
                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <h3 className="text-sm font-semibold mb-3">{topupTitle}</h3>
                  <div className="space-y-2.5">
                    {packs.map((pack, index) => (
                      <motion.div
                        key={pack.credits}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + index * 0.06 }}
                        className={`relative rounded-xl border p-3.5 transition-all ${pack.popular ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : 'border-border/60 hover:border-border'}`}
                      >
                        {pack.popular && (
                          <Badge className="absolute -top-2.5 right-3 text-[10px] px-2 bg-primary text-primary-foreground border-0">
                            Popular
                          </Badge>
                        )}
                        <div className="flex items-center justify-between mb-2.5">
                          <div>
                            <span className="text-base font-bold">{pack.credits}</span>
                            <span className="text-xs text-muted-foreground ml-1">credits</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{pack.priceDisplay}</div>
                            <div className="text-[11px] text-muted-foreground">{pack.unitPriceDisplay}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs"
                          variant={pack.popular ? 'default' : 'outline'}
                          onClick={() => startCheckout(pack.credits)}
                          disabled={isStarting}
                        >
                          {isStarting ? 'Starting...' : 'Buy Now'}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Custom */}
                <div ref={customCreditsRef} className="rounded-xl border border-border/60 bg-card p-4">
                  <h3 className="text-sm font-semibold mb-3">{customTitle}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">Credits (min 3)</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={3}
                          value={customCredits}
                          onChange={(e) => setCustomCredits(parseInt(e.target.value || '3', 10))}
                          className="h-8 text-sm"
                        />
                        {[10, 25, 50].map((n) => (
                          <Button key={n} variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setCustomCredits(n)}>
                            {n}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price/credit</span>
                        <span className="font-medium">{customPricing.ppcDisplay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credits</span>
                        <span className="font-medium tabular-nums">{customPricing.credits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{customPricing.subtotalDisplay}</span>
                      </div>
                      <div className="h-px bg-border/60 my-1" />
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">Total</span>
                        <span className="font-semibold">{customPricing.totalDisplay}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full gap-1.5"
                      size="sm"
                      onClick={() => startCheckout(customPricing.credits)}
                      disabled={isStarting}
                    >
                      {isStarting ? 'Starting...' : 'Continue to Pay'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground leading-relaxed">{topupFooter}</p>
                  </div>
                </div>
              </div>
            </div>

            {isChecking && (
              <p className="mt-4 text-xs text-muted-foreground text-center">Verifying payment status...</p>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
