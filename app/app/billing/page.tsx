'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { ArrowRight, Calendar, Coins, Copy as CopyIcon, CreditCard, TrendingUp } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    ? 'Tailor resumes freely, then pay R25 only when you want to download a tailored resume. Credits remain optional for other AI extras.'
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

    setMe({
      credits: data.user?.credits,
      name: data.user?.name,
      market: data.user?.market,
    });
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
      if (!res.ok || !data?.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to initiate checkout');
      }
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
        const res = await fetch(`/api/payments/status?purchaseId=${encodeURIComponent(purchaseId)}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.ok) {
          toast.error('Could not verify payment status');
          return;
        }

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
      } catch {
        toast.error('Status check error');
      } finally {
        setIsChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const scrollToCustomCredits = () =>
    customCreditsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 py-8">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{pageTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Usage This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{balanceTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="mx-auto h-10 w-24" />
                  <Skeleton className="mt-3 h-9 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{topupTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))}
                </CardContent>
              </Card>
              <Card ref={customCreditsRef}>
                <CardHeader>
                  <CardTitle>{customTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">{pageTitle}</h1>
            <p className="text-muted-foreground">{pageDescription}</p>
          </div>

          <div className="mb-4 rounded-md bg-yellow-100 p-3 text-center font-semibold text-yellow-900">
            {promoMessage}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Latest purchase</div>
                      <div className="text-base font-medium">
                        {latestPaid
                          ? `${latestPaid.description} - ${formatCurrencyAmount(latestPaid.amountMinor, latestPaid.currency)}`
                          : 'No purchases yet'}
                      </div>
                      <div className="text-xs text-muted-foreground">{latestPaid ? latestPaid.date : ''}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{me?.credits ?? 0}</div>
                      <p className="text-sm text-muted-foreground">{balanceHelp}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{history.filter((item) => item.status === 'PAID').length}</div>
                      <p className="text-sm text-muted-foreground">Completed purchases</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href="/pricing" className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Pricing
                      </Button>
                    </Link>
                    <Button onClick={scrollToCustomCredits}>
                      {isSouthAfrica ? 'Top Up Credits' : 'Top Up'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Usage This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{isSouthAfrica ? 'Credits Used for Extras' : 'Credits Used'}</span>
                      <span className="text-sm font-medium">- / -</span>
                    </div>
                    <Progress value={0} className="h-2" />
                    <div className="grid grid-cols-3 gap-4 pt-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold">-</div>
                        <p className="text-muted-foreground">Resume builds</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">-</div>
                        <p className="text-muted-foreground">JD tailoring</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">-</div>
                        <p className="text-muted-foreground">Cover letters</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Billing History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No purchases yet.</p>
                    ) : null}

                    {history.map((row, index) => {
                      const statusMeta =
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
                          className="rounded-lg p-3 transition-colors hover:bg-muted/50"
                        >
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_120px_112px_40px] md:items-center">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{row.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {row.date} · {row.provider} · {row.market}
                              </p>
                            </div>

                            <div className="font-mono tabular-nums text-left md:w-[120px] md:justify-self-end md:text-right">
                              {formatCurrencyAmount(row.amountMinor, row.currency)}
                            </div>

                            <div className="md:w-[112px] md:justify-self-end">
                              <Badge variant="outline" className={`w-full justify-center ${statusMeta.cls}`}>
                                {statusMeta.label}
                              </Badge>
                            </div>

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

            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5" />
                      {balanceTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <motion.div
                      className="mb-2 text-4xl font-bold text-primary"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {me?.credits ?? 0}
                    </motion.div>
                    <p className="mb-4 text-sm text-muted-foreground">{balanceHelp}</p>
                    <Button className="w-full" onClick={scrollToCustomCredits}>
                      {isSouthAfrica ? 'Buy Credits for Extras' : 'Top Up'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <Card>
                <CardHeader>
                  <CardTitle>{topupTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {packs.map((pack, index) => {
                    return (
                      <motion.div
                        key={pack.credits}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.08 }}
                        className="relative"
                      >
                        {pack.popular ? (
                          <Badge className="absolute -right-2 -top-2 z-10 bg-primary text-primary-foreground">
                            Popular
                          </Badge>
                        ) : null}

                        <Card className={pack.popular ? 'ring-2 ring-primary' : ''}>
                          <CardContent className="p-4">
                            <div className="mb-2 flex items-center justify-between">
                              <div>
                                <span className="block text-lg font-bold">{pack.credits}</span>
                                <span className="block text-sm text-muted-foreground">credits</span>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{pack.priceDisplay}</div>
                                <div className="text-xs text-muted-foreground">{pack.unitPriceDisplay}</div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className="w-full"
                              variant={pack.popular ? 'default' : 'outline'}
                              onClick={() => startCheckout(pack.credits)}
                              disabled={isStarting}
                            >
                              {isStarting ? 'Starting...' : 'Buy Now'}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card ref={customCreditsRef}>
                <CardHeader>
                  <CardTitle>{customTitle}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Credits (min 3)</label>
                    <div className="mt-1 flex gap-2">
                      <Input
                        type="number"
                        min={3}
                        value={customCredits}
                        onChange={(event) => setCustomCredits(parseInt(event.target.value || '3', 10))}
                      />
                      <Button variant="outline" onClick={() => setCustomCredits(10)}>
                        10
                      </Button>
                      <Button variant="outline" onClick={() => setCustomCredits(25)}>
                        25
                      </Button>
                      <Button variant="outline" onClick={() => setCustomCredits(50)}>
                        50
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>Price/credit</span>
                      <span className="font-medium">{customPricing.ppcDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits</span>
                      <span className="font-medium">{customPricing.credits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">{customPricing.subtotalDisplay}</span>
                    </div>
                    <div className="col-span-2 my-1 h-px bg-muted/60" />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold">{customPricing.totalDisplay}</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => startCheckout(customPricing.credits)} disabled={isStarting}>
                    {isStarting ? 'Starting...' : 'Continue to Pay'} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">{topupFooter}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {isChecking ? (
            <p className="mt-4 text-xs text-muted-foreground">Verifying payment status...</p>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
