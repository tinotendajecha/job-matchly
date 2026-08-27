'use client';

import { useCallback, useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive, Briefcase, CalendarClock, Timer, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '../lib/utils';

type JobStatus = 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';

interface ArchiveJob {
  id: string;
  title: string;
  company: string | null;
  market: string;
  bracket: string | null;
  source: string;
  url: string;
  status: JobStatus;
  postedAt: string | null;
  closedAt: string | null;
  createdAt: string;
}

interface JobsData {
  ok: boolean;
  stats: {
    active: number;
    expired: number;
    archived: number;
    closedThisWeek: number;
    archiveAfterDays: number;
    historySince: string | null;
    avgDaysOnMarket: number | null;
    avgSampleSize: number;
    byMarket: Array<{ market: string; count: number }>;
  };
  status: JobStatus | 'ALL';
  jobs: ArchiveJob[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const FILTERS: Array<{ key: JobStatus | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Live' },
  { key: 'EXPIRED', label: 'Recently closed' },
  { key: 'ARCHIVED', label: 'Archived' },
];

const STATUS_VARIANT: Record<JobStatus, 'default' | 'secondary' | 'outline'> = {
  ACTIVE: 'default',
  EXPIRED: 'secondary',
  ARCHIVED: 'outline',
};

function daysOnMarket(job: ArchiveJob): string {
  if (!job.postedAt || !job.closedAt) return '—';
  const ms = new Date(job.closedAt).getTime() - new Date(job.postedAt).getTime();
  if (ms <= 0) return '—';
  return `${Math.round(ms / 86_400_000)}d`;
}

export default function AdminJobsPage() {
  const [data, setData] = useState<JobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), status });
      if (query) params.set('q', query);
      const res = await fetch(`/api/admin/jobs?${params}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [page, status, query]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilter(next: JobStatus | 'ALL') {
    if (next === status) return;
    setStatus(next);
    setPage(1);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search.trim());
    setPage(1);
  }

  const stats = data?.stats;
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Job archive</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every listing we&apos;ve ever ingested, including closed ones. Job seekers only ever see
          live vacancies — this history is kept so we can measure how the market moves.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn&apos;t load the archive</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)
        ) : stats ? (
          <>
            <MetricCard title="Live now" value={stats.active.toLocaleString()} icon={Briefcase} />
            <MetricCard
              title="Recently closed"
              value={stats.expired.toLocaleString()}
              icon={CalendarClock}
              description={`Archived after ${stats.archiveAfterDays} days`}
            />
            <MetricCard title="Archived" value={stats.archived.toLocaleString()} icon={Archive} description="Kept indefinitely" />
            <MetricCard
              title="Avg days on market"
              value={stats.avgDaysOnMarket ? `${stats.avgDaysOnMarket.toFixed(1)}d` : '—'}
              icon={Timer}
              description={
                stats.avgSampleSize
                  ? `From ${stats.avgSampleSize.toLocaleString()} listings with both dates`
                  : 'Needs listings with a posted and closed date'
              }
            />
          </>
        ) : null}
      </div>

      {stats && (
        <Alert>
          <Archive className="h-4 w-4" />
          <AlertTitle>Nothing is deleted</AlertTitle>
          <AlertDescription>
            Closed listings move to the archive after {stats.archiveAfterDays} days instead of being
            removed.{' '}
            {stats.historySince
              ? `History runs from ${new Date(stats.historySince).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })} and deepens with every weekly run.`
              : 'History starts accumulating from the next ingest run.'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-base">Listings</CardTitle>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => applyFilter(f.key)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                    status === f.key
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <form onSubmit={submitSearch} className="flex gap-2 lg:ml-auto">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title or company"
                className="h-9 w-full lg:w-64"
              />
              <Button type="submit" size="sm" variant="outline">
                Search
              </Button>
            </form>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : data && data.jobs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Bracket</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Closed</TableHead>
                      <TableHead className="text-right">On market</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="max-w-[280px]">
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline line-clamp-1"
                          >
                            {job.title}
                          </a>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {job.company || 'Unknown employer'} · {job.source}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.bracket || '—'}
                        </TableCell>
                        <TableCell className="text-sm">{job.market}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[job.status]}>{job.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {job.closedAt ? formatRelativeTime(new Date(job.closedAt)) : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {daysOnMarket(job)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <p className="text-xs text-muted-foreground">
                    {pagination.total.toLocaleString()} listings · page {pagination.page} of{' '}
                    {pagination.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            !error && (
              <div className="py-12 text-center">
                <Archive className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">
                  {status === 'ARCHIVED'
                    ? 'Nothing archived yet'
                    : query
                      ? 'No listings match that search'
                      : 'No listings here'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {status === 'ARCHIVED' && !query
                    ? `Listings move here ${stats?.archiveAfterDays ?? 60} days after they close, so the first ones will appear once the archive is that old.`
                    : 'Try a different filter or search term.'}
                </p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
