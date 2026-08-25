'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MetricCard } from '../components/MetricCard';
import { AlertCircle, Database, Clock, Trash2, TriangleAlert } from 'lucide-react';
import { AdminSystemData } from '../types';
import { formatNumber, formatRelativeTime } from '../lib/utils';

const COUNT_LABELS: Record<string, string> = {
  users: 'Users',
  documents: 'Documents',
  purchases: 'Purchases',
  sessions: 'Sessions',
  pageViews: 'Page views',
  briefingItems: 'Briefing articles',
  broadcasts: 'Broadcasts',
  deliveries: 'Email deliveries',
};

export default function SystemPage() {
  const [data, setData] = useState<AdminSystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/admin/system', { cache: 'no-store' });
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

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">System</h1>
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
        <Skeleton className="h-9 w-40" />
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
      </div>
    );
  }

  const { database, counts, integrations, cron, retention, errors, errorsLast7Days } = data;
  const cronStale = cron.daysSince !== null && cron.daysSince > 8;
  const retentionStale = retention.oldestAgeDays !== null && retention.oldestAgeDays > retention.retentionDays + 8;

  const groups = integrations.reduce<Record<string, typeof integrations>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System</h1>
        <p className="text-muted-foreground mt-1">
          Live checks and real error history. Uptime and request-latency monitoring lives in Vercel, not here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Database"
          value={`${database.latencyMs} ms`}
          icon={Database}
          description="Measured round-trip just now"
        />
        <MetricCard
          title="Weekly job"
          value={cron.daysSince === null ? 'Never run' : cron.daysSince === 0 ? 'Today' : `${cron.daysSince}d ago`}
          icon={Clock}
          description={cronStale ? 'Overdue — expected weekly' : `Last status: ${cron.lastStatus ?? '—'}`}
        />
        <MetricCard
          title="Page-view retention"
          value={retention.oldestAgeDays === null ? 'No data' : `${retention.oldestAgeDays}d oldest`}
          icon={Trash2}
          description={retentionStale ? 'Prune may not be running' : `Limit ${retention.retentionDays} days`}
        />
        <MetricCard
          title="Errors (7 days)"
          value={formatNumber(errorsLast7Days)}
          icon={TriangleAlert}
          description="Failed email deliveries"
        />
      </div>

      {(cronStale || retentionStale) && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Maintenance attention needed</AlertTitle>
          <AlertDescription>
            {cronStale && <span className="block">The weekly job hasn&apos;t run in over 8 days.</span>}
            {retentionStale && (
              <span className="block">
                Page views older than the retention limit still exist — the prune may not be running.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg">Integrations</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Whether each key is present. Values are never sent to the browser.
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                {items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-mono text-xs text-foreground truncate">{item.key}</span>
                    <Badge variant={item.configured ? 'default' : 'destructive'} className="flex-shrink-0">
                      {item.configured ? 'Set' : 'Missing'}
                    </Badge>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg">Recent Errors</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Real failures from content ingest, email delivery and payments
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No errors recorded.
                    </TableCell>
                  </TableRow>
                )}
                {errors.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Badge variant="outline">{e.source}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="text-sm text-foreground line-clamp-2">{e.message}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{e.context}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(new Date(e.at))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg">Data Volume</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(counts).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{COUNT_LABELS[key] ?? key}</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{formatNumber(value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
