'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  CreditCard,
  Coins,
  TrendingUp,
  Calendar,
  ArrowRight,
  Copy as CopyIcon, // clipboard icon
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Skeleton } from '@/components/ui/skeleton'; // uses your existing skeleton component

// Centralized pricing helpers
import { pricePerCreditUSD, computeSubtotalUSD } from '@/lib/pricing';

// Currency formatter (uniform)
const fmtUSD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type Pack = { credits: number; priceUsd: number; bonus?: number; popular?: boolean };
type HistoryItem = { id: string; date: string; description: string; amount: string; currency: string; status: string; providerRef: string | null };

const statusStyle: Record<string, { label: string; cls: string }> = {
  PAID: { label: 'Paid', cls: 'bg-green-100 text-green-700 border-green-200' },
  FAILED: { label: 'Failed', cls: 'bg-red-100 text-red-700 border-red-200' },
  CANCELED: { label: 'Canceled', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  PENDING: { label: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export default function BillingPage() {
  const searchParams = useSearchParams();

  // Loading states
  const [isChecking, setIsChecking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Live user + history
  const [me, setMe] = useState<{ credits: number; name?: string | null } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Custom credits
  const [customCredits, setCustomCredits] = useState<number>(3);
  const customCreditsRef = useRef<HTMLDivElement>(null);

  // Pricing derived from centralized helpers
  const customPricing = useMemo(() => {
    const credits = Math.max(3, Math.floor(customCredits || 3));
    const ppc = pricePerCreditUSD(credits);
    const subtotal = +computeSubtotalUSD(credits).toFixed(2);
    const total = subtotal;
    return { credits, ppc, subtotal, total };
  }, [customCredits]);

  // Packs from pricing helpers
  const PACK_CREDITS = [10, 25, 50] as const;
  const PACKS: Pack[] = PACK_CREDITS.map((c) => ({
    credits: c,
    priceUsd: computeSubtotalUSD(c),
    popular: c === 10,
  }));

  // Data loaders
  async function loadMe() {
    const r = await fetch('/api/auth/me', { cache: 'no-store' }).catch(() => null);
    if (!r?.ok) return;
    const j = await r.json();
    if (j?.ok) setMe({ credits: j.user?.credits, name: j.user?.name });
  }
  async function loadHistory() {
    const r = await fetch('/api/billing/history', { cache: 'no-store' }).catch(() => null);
    if (!r?.ok) return;
    const j = await r.json();
    if (j?.ok) {
      const items = (j.items as any[]).map((it) => ({
        ...it,
        date: new Date(it.date).toISOString().slice(0, 10),
        amount: fmtUSD.format(Number(it.amount)),
      }));
      setHistory(items);
    }
  }

  useEffect(() => {
    (async () => {
      setIsPageLoading(true);
      await Promise.all([loadMe(), loadHistory()]);
      setIsPageLoading(false);
    })();
  }, []);

  // Latest paid purchase for Current Status
  const latestPaid = useMemo(() => history.find((h) => h.status === 'PAID') || null, [history]);

  // Start checkout
  async function startCheckout(credits: number) {
    setIsStarting(true);
    try {
      const res = await fetch('/api/billing/pesepay/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ credits }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.url) throw new Error(data?.error || 'Failed to initiate checkout');
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err?.message || 'Could not start checkout');
    } finally {
      setIsStarting(false);
    }
  }

  const handleBuyPack = async (pack: Pack) => startCheckout(pack.credits);
  const handleCustomCheckout = async () => startCheckout(customPricing.credits);

  // After-return reconciliation
  useEffect(() => {
    const purchaseId = searchParams.get('purchase');
    if (!purchaseId) return;

    let cancelled = false;
    (async () => {
      setIsChecking(true);
      try {
        const res = await fetch(`/api/billing/pesepay/status?purchaseId=${encodeURIComponent(purchaseId)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.ok) {
          toast.error('Could not verify payment status');
          return;
        }
        const status = String(data.status || '').toUpperCase();
        if (status === 'PAID') {
          toast.success('Payment successful — credits have been added to your account');
          await Promise.all([loadMe(), loadHistory()]);
        } else if (status === 'FAILED') {
          toast.error('Payment failed — no charges were applied');
        } else if (status === 'CANCELED') {
          toast.info('Payment was canceled');
        } else {
          toast.info('Payment is still pending, you will be notified when it clears');
        }
      } catch {
        toast.error('Status check error');
      } finally {
        setIsChecking(false);
      }
    })();

    return () => { cancelled = true; };
  }, [searchParams]);

  // Smooth scroll to Custom Credits
  const goToCustomCredits = () => customCreditsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
          {/* Page Skeleton */}
          {isPageLoading ? (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card><CardHeader><CardTitle>Billing & Credits</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
                <Card><CardHeader><CardTitle>Usage This Month</CardTitle></CardHeader>
                  <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                </Card>
                <Card><CardHeader><CardTitle>Billing History</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card><CardHeader><CardTitle>Credit Balance</CardTitle></CardHeader>
                  <CardContent><Skeleton className="h-10 w-24 mx-auto" /><Skeleton className="h-9 w-full mt-3" /></CardContent>
                </Card>
                <Card><CardHeader><CardTitle>Buy Credits (USD)</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                  </CardContent>
                </Card>
                <Card ref={customCreditsRef}><CardHeader><CardTitle>Custom Credits</CardTitle></CardHeader>
                  <CardContent><Skeleton className="h-32 w-full" /></CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Billing & Credits</h1>
                <p className="text-muted-foreground">Buy credits and track your usage. 1 credit = 1 tailored resume.</p>
              </div>

              <div className="p-3 mb-4 bg-yellow-100 text-yellow-900 rounded-md text-center font-semibold">
                🎉 Early Pricing Promotion: Get 10 credits for just $3! Prices auto-calculated for other packs.
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Current Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Current Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">Latest purchase</div>
                          <div className="text-base font-medium">
                            {latestPaid ? `${latestPaid.description} • ${latestPaid.amount}` : 'No purchases yet'}
                          </div>
                          <div className="text-xs text-muted-foreground">{latestPaid ? latestPaid.date : ''}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{me?.credits ?? 0}</div>
                          <p className="text-sm text-muted-foreground">Credits remaining</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">—</div>
                          <p className="text-sm text-muted-foreground">Credits used</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href="/pricing" className="flex-1">
                          <Button variant="outline" className="w-full">Explore Subscriptions</Button>
                        </Link>
                        {/* <Button onClick={() => { loadMe(); loadHistory(); }} variant="ghost">Refresh</Button> */}
                        <Button onClick={() => customCreditsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                          Top Up
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Usage (placeholder retained) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Usage This Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Credits Used</span>
                          <span className="text-sm font-medium">— / —</span>
                        </div>
                        <Progress value={0} className="h-2" />
                        <div className="grid grid-cols-3 gap-4 pt-4 text-sm">
                          <div className="text-center"><div className="font-bold text-lg">—</div><p className="text-muted-foreground">Resume builds</p></div>
                          <div className="text-center"><div className="font-bold text-lg">—</div><p className="text-muted-foreground">JD tailoring</p></div>
                          <div className="text-center"><div className="font-bold text-lg">—</div><p className="text-muted-foreground">Cover letters</p></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Billing History (responsive, non-squished) */}
                  {/* Billing history (aligned grid on desktop, stacked on mobile) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Billing History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {history.length === 0 && (
                          <p className="text-sm text-muted-foreground">No purchases yet.</p>
                        )}

                        {history.map((row, index) => {
                          const meta =
                            row.status === 'PAID'
                              ? { label: 'Paid', cls: 'bg-green-100 text-green-700 border-green-200' }
                              : row.status === 'FAILED'
                                ? { label: 'Failed', cls: 'bg-red-100 text-red-700 border-red-200' }
                                : row.status === 'CANCELED'
                                  ? { label: 'Canceled', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
                                  : { label: 'Pending', cls: 'bg-amber-100 text-amber-700 border-amber-200' };

                          return (
                            <motion.div
                              key={row.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              {/* Stacked on mobile; 4 fixed columns on md+ for perfect alignment */}
                              <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_120px_112px_40px] md:items-center">
                                {/* Col 1: Description + date */}
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{row.description}</p>
                                  <p className="text-xs text-muted-foreground">{row.date}</p>
                                </div>

                                {/* Col 2: Amount (fixed width, tabular digits) */}
                                <div className="font-mono tabular-nums md:justify-self-end md:w-[120px] text-left md:text-right">
                                  {row.amount}
                                </div>

                                {/* Col 3: Status badge (fixed width so the column never shifts) */}
                                <div className="md:justify-self-end md:w-[112px]">
                                  <Badge variant="outline" className={`w-full justify-center ${meta.cls}`}>
                                    {meta.label}
                                  </Badge>
                                </div>

                                {/* Col 4: Copy reference (clipboard icon) */}
                                <div className="md:justify-self-end">
                                  <Button
                                    title="Copy reference"
                                    variant="ghost"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => row.providerRef && navigator.clipboard?.writeText(row.providerRef)}
                                  >
                                    <CopyIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Credit Balance */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                      <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                          <Coins className="h-5 w-5" />
                          Credit Balance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <motion.div className="text-4xl font-bold text-primary mb-2" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                          {me?.credits ?? 0}
                        </motion.div>
                        <p className="text-muted-foreground text-sm mb-4">Credits available</p>
                        <Button className="w-full" onClick={() => customCreditsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                          Top Up
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Quick Packs (USD) */}
                  <Card>
                    <CardHeader><CardTitle>Buy Credits (USD)</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {PACKS.map((pack, index) => {
                        const unit = (pack.priceUsd / pack.credits).toFixed(2);
                        return (
                          <motion.div key={pack.credits} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.08 }} className="relative">
                            {pack.popular && (
                              <Badge className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground">
                                Popular
                              </Badge>
                            )}
                            <Card className={pack.popular ? 'ring-2 ring-primary' : ''}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <div>
                                    <span className="font-bold text-lg">{pack.credits}</span>
                                    <span className="text-sm text-muted-foreground block">credits</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold">{fmtUSD.format(pack.priceUsd)}</div>
                                    <div className="text-xs text-muted-foreground">{fmtUSD.format(Number(unit))}/credit</div>
                                  </div>
                                </div>
                                <Button size="sm" className="w-full" variant={pack.popular ? 'default' : 'outline'} onClick={() => handleBuyPack(pack)} disabled={isStarting}>
                                  {isStarting ? 'Starting…' : 'Buy Now'}
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Custom Credits */}
                  <Card ref={customCreditsRef}>
                    <CardHeader><CardTitle>Custom Credits</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Credits (min 3)</label>
                        <div className="flex gap-2 mt-1">
                          <Input type="number" min={3} value={customCredits} onChange={(e) => setCustomCredits(parseInt(e.target.value || '3', 10))} />
                          <Button variant="outline" onClick={() => setCustomCredits(10)}>10</Button>
                          <Button variant="outline" onClick={() => setCustomCredits(25)}>25</Button>
                          <Button variant="outline" onClick={() => setCustomCredits(50)}>50</Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span>Price/credit</span>
                          <span className="font-medium">{fmtUSD.format(customPricing.ppc)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Credits</span>
                          <span className="font-medium">{customPricing.credits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-medium">{fmtUSD.format(customPricing.subtotal)}</span>
                        </div>
                        <div className="col-span-2 h-px bg-muted/60 my-1" />
                        <div className="flex justify-between text-base">
                          <span className="font-semibold">Total</span>
                          <span className="font-semibold">{fmtUSD.format(customPricing.total)}</span>
                        </div>
                      </div>

                      <Button className="w-full" onClick={handleCustomCheckout} disabled={isStarting}>
                        {isStarting ? 'Starting…' : 'Continue to Pay'} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">Card payments supported. Paystack & EcoCash coming soon.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {isChecking && <p className="text-xs text-muted-foreground mt-4">Verifying payment status…</p>}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
