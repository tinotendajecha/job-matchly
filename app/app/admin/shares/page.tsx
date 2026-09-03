'use client';

import { useCallback, useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Share2, Eye, UserPlus, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SharesData {
  days: number;
  windows: number[];
  trackingSince: string | null;
  funnel: {
    shared: number;
    viewed: number;
    uniqueViewers: number;
    signedOutViews: number;
    signups: number;
    viewsPerShare: number | null;
    signupRate: number | null;
  };
  allTime: { shared: number; viewed: number; signups: number };
  referrers: Array<{ host: string | null; count: number }>;
  topJobs: Array<{
    jobId: string;
    title: string;
    company: string | null;
    bracket: string | null;
    market: string | null;
    shared: number;
    viewed: number;
    signups: number;
  }>;
  byBracket: Array<{ bracket: string; viewed: number; signups: number }>;
}

export default function AdminSharesPage() {
  const [data, setData] = useState<SharesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/shares?days=${days}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const f = data?.funnel;
  const nothingYet = data && data.allTime.shared === 0 && data.allTime.viewed === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Job sharing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Whether people passing job links around actually brings anyone new to JobMatchly.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t load share analytics</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {(data?.windows ?? [7, 30, 90]).map((w) => (
          <button
            key={w}
            onClick={() => setDays(w)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              days === w
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            Last {w} days
          </button>
        ))}
      </div>

      {nothingYet && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No shares recorded yet</AlertTitle>
          <AlertDescription>
            Sharing shipped on 3 September 2026. Until someone shares a job and another person opens
            it, every number below is genuinely zero rather than missing.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading && !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)
        ) : f ? (
          <>
            <MetricCard
              title="Links shared"
              value={f.shared.toLocaleString()}
              icon={Share2}
              description={`${data!.allTime.shared.toLocaleString()} all time`}
            />
            <MetricCard
              title="People who opened one"
              value={f.uniqueViewers.toLocaleString()}
              icon={Eye}
              description={`${f.viewed.toLocaleString()} views, crawlers excluded`}
            />
            <MetricCard
              title="Views per share"
              value={f.viewsPerShare === null ? '—' : f.viewsPerShare.toFixed(1)}
              icon={TrendingUp}
              description={f.shared === 0 ? 'Needs at least one share' : 'How far a link travels'}
            />
            <MetricCard
              title="Signups from a job link"
              value={f.signups.toLocaleString()}
              icon={UserPlus}
              description={
                f.signupRate === null
                  ? 'Needs signed-out visits first'
                  : `${(f.signupRate * 100).toFixed(1)}% of signed-out visits`
              }
            />
          </>
        ) : null}
      </div>

      {data && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How to read these</AlertTitle>
          <AlertDescription>
            Public job pages are indexable, so a view is not proof of a share — search and direct
            traffic land on the same URLs. Preview crawlers (WhatsApp, Facebook, Slack) fetch every
            link that gets pasted; those are excluded at write time, so they never reach these
            counts. Messaging apps strip the referrer, so &ldquo;Direct or in-app&rdquo; below is
            where most genuine shares appear.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where views came from</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : data && data.referrers.length > 0 ? (
              <div className="space-y-2">
                {data.referrers.map((r) => {
                  const max = Math.max(...data.referrers.map((x) => x.count), 1);
                  return (
                    <div key={r.host ?? 'direct'} className="flex items-center gap-3 text-sm">
                      <span className="w-40 truncate text-muted-foreground">
                        {r.host ?? 'Direct or in-app'}
                      </span>
                      <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${(r.count / max) * 100}%` }}
                        />
                      </span>
                      <span className="w-10 text-right tabular-nums text-xs text-muted-foreground">
                        {r.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No views yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Which fields travel</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : data && data.byBracket.length > 0 ? (
              <div className="space-y-2">
                {data.byBracket.slice(0, 8).map((b) => {
                  const max = Math.max(...data.byBracket.map((x) => x.viewed), 1);
                  return (
                    <div key={b.bracket} className="flex items-center gap-3 text-sm">
                      <span className="w-40 truncate text-muted-foreground">{b.bracket}</span>
                      <span className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${(b.viewed / max) * 100}%` }}
                        />
                      </span>
                      <span className="w-16 text-right tabular-nums text-xs text-muted-foreground">
                        {b.viewed}
                        {b.signups > 0 && <span className="text-primary"> · {b.signups}</span>}
                      </span>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground pt-1">Views · signups</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nothing shared yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most-travelled listings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : data && data.topJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead className="text-right">Shared</TableHead>
                    <TableHead className="text-right">Opened</TableHead>
                    <TableHead className="text-right">Signups</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topJobs.map((j) => (
                    <TableRow key={j.jobId}>
                      <TableCell className="max-w-[280px]">
                        <a
                          href={`/jobs/${j.jobId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline line-clamp-1"
                        >
                          {j.title}
                        </a>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {j.company || 'Unknown employer'}
                          {j.market ? ` · ${j.market}` : ''}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {j.bracket || '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{j.shared}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{j.viewed}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right tabular-nums text-sm',
                          j.signups > 0 && 'text-primary font-medium'
                        )}
                      >
                        {j.signups}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No listings have been shared or opened in this window.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
