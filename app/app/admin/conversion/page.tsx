'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MetricCard } from '../components/MetricCard';
import { PurchasesTable } from '../components/PurchasesTable';
import { AlertCircle, AlertTriangle, Target, Repeat, Timer, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdminConversionData, MoneyByCurrency } from '../types';
import { formatNumber } from '../lib/utils';
import { formatMinorCurrency } from '@/lib/market/config';

const AXIS = 'hsl(var(--muted-foreground))';
const GRID = 'hsl(var(--border))';
const TOOLTIP = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

/** Renders each currency separately — never a cross-currency total. */
function moneyLabel(money: MoneyByCurrency): string {
  const entries = Object.entries(money);
  if (!entries.length) return '—';
  return entries
    .map(([currency, v]) => formatMinorCurrency(v.minor, currency, currency === 'ZAR' ? 'en-ZA' : 'en-US'))
    .join(' · ');
}

export default function ConversionPage() {
  const [data, setData] = useState<AdminConversionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocksOnly, setUnlocksOnly] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/admin/conversion', { cache: 'no-store' });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Failed to load');
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const purchases = useMemo(() => {
    if (!data) return [];
    return unlocksOnly ? data.purchases.filter((p) => p.type === 'RESUME_DOWNLOAD_UNLOCK') : data.purchases;
  }, [data, unlocksOnly]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Conversion &amp; Trials</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[280px] w-full" />
      </div>
    );
  }

  const { funnel, rates, trials, money, marketSplit, cohorts } = data;

  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Conversion &amp; Trials</h1>
        <p className="text-muted-foreground mt-1">
          How people move from signing up to paying
        </p>
      </div>

      {money.stuckUnlocks > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {money.stuckUnlocks} unlock payment{money.stuckUnlocks === 1 ? '' : 's'} stuck pending
          </AlertTitle>
          <AlertDescription>
            {moneyLabel(money.pendingUnlocks)} of download unlocks were started over 24 hours ago and never
            completed. These are the only real purchase attempts the product has had — worth investigating why
            they didn&apos;t go through.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Paying Customers"
          value={formatNumber(rates.payingCustomers)}
          icon={CreditCard}
          description="Completed unlock or active plan"
        />
        <MetricCard
          title="Active Trials"
          value={formatNumber(trials.active)}
          icon={Timer}
          description={`${trials.converted} converted to paid`}
        />
        <MetricCard
          title="Activation Rate"
          value={`${rates.activationRate.toFixed(1)}%`}
          icon={Target}
          description="Signed up and created a document"
        />
        <MetricCard
          title="Repeat Users"
          value={formatNumber(rates.repeatUsers)}
          icon={Repeat}
          description="Created 2+ documents"
        />
      </div>

      {/* Funnel */}
      <Card className="bg-card border-border">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg">Conversion Funnel</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Each stage as a share of total signups
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2 space-y-3">
          {funnel.map((stage) => {
            const pct = funnel[0].count > 0 ? (stage.count / funnel[0].count) * 100 : 0;
            return (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-foreground">{stage.stage}</span>
                  <span className="text-muted-foreground">
                    {formatNumber(stage.count)}
                    <span className="ml-2 text-xs">({pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(pct, stage.count > 0 ? 1.5 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Money — three separate figures, deliberately never summed */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue collected</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl font-bold text-foreground">{moneyLabel(money.realRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed download unlocks only</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending unlocks</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl font-bold text-foreground">{moneyLabel(money.pendingUnlocks)}</div>
            <p className="text-xs text-muted-foreground mt-1">Started but never completed</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bonus grants issued</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl font-bold text-foreground">{formatNumber(money.bonusGrantCount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Credits, not revenue — counted, not totalled</p>
          </CardContent>
        </Card>
      </div>

      {/* Trials */}
      <Card className="bg-card border-border">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg">Active Trials</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Trial ends</TableHead>
                  <TableHead>Days left</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trials.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      No active trials.
                    </TableCell>
                  </TableRow>
                )}
                {trials.rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{t.name || 'Anonymous'}</div>
                      <div className="text-sm text-muted-foreground">{t.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{t.tier}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{t.market}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {t.trialEndsAt ? new Date(t.trialEndsAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      {t.daysRemaining === null ? (
                        '—'
                      ) : (
                        <Badge variant={t.daysRemaining <= 3 ? 'destructive' : 'outline'}>
                          {t.daysRemaining <= 0 ? 'Expired' : `${t.daysRemaining}d`}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Weekly Activation</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Signups per week and how many created a document within 7 days
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cohorts} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="week" stroke={AXIS} fontSize={10} angle={-35} textAnchor="end" height={55} />
                <YAxis stroke={AXIS} fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="signups" name="Signups" fill="hsl(var(--chart-1))" />
                <Bar dataKey="activated" name="Activated" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base sm:text-lg">Documents by Market</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              By document, not by user — accounts aren&apos;t market-tagged
            </p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={marketSplit} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="market" stroke={AXIS} fontSize={11} />
                <YAxis stroke={AXIS} fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="count" name="Documents" fill="hsl(var(--chart-3))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="p-4 sm:p-6 pb-2 flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base sm:text-lg">Purchase Attempts</CardTitle>
          <Button variant={unlocksOnly ? 'default' : 'outline'} size="sm" onClick={() => setUnlocksOnly((v) => !v)}>
            {unlocksOnly ? 'Showing real unlocks' : 'Real unlocks only'}
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <PurchasesTable purchases={purchases} />
        </CardContent>
      </Card>
    </div>
  );
}
