'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Newspaper, CalendarDays, Tag, Globe, AlertCircle } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';

interface ContentItem {
  id: string;
  title: string;
  category: string;
  source: string;
  sourceDetail: string;
  url: string;
  createdAt: string;
}

interface IngestRunItem {
  id: string;
  trigger: 'MANUAL' | 'CRON';
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  saved: number;
  skipped: number;
  errors: number;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
}

interface ContentData {
  totalArticles: number;
  articlesThisWeek: number;
  byCategory: Array<{ category: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  recentItems: ContentItem[];
  recentRuns: IngestRunItem[];
}

function durationLabel(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return '—';
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

const STATUS_VARIANT: Record<IngestRunItem['status'], 'default' | 'destructive' | 'secondary'> = {
  SUCCESS: 'default',
  FAILED: 'destructive',
  RUNNING: 'secondary',
};

export default function ContentPage() {
  const [data, setData] = useState<ContentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/admin/content', { cache: 'no-store' });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Failed to fetch data');
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="space-y-6 w-full min-w-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content</h1>
          <p className="text-muted-foreground mt-1">Career Briefing scraping pipeline</p>
        </div>
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
      <div className="space-y-6 w-full min-w-0">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
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

  const topCategory = data.byCategory[0];
  const topSource = data.bySource[0];

  return (
    <div className="space-y-8 w-full min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Content</h1>
        <p className="text-muted-foreground mt-1">Career Briefing scraping pipeline — what's been ingested and when</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Articles" value={data.totalArticles} icon={Newspaper} />
        <MetricCard title="Added This Week" value={data.articlesThisWeek} icon={CalendarDays} />
        <MetricCard
          title="Top Category"
          value={topCategory ? topCategory.category : '—'}
          icon={Tag}
          description={topCategory ? `${topCategory.count} articles` : undefined}
        />
        <MetricCard
          title="Top Source"
          value={topSource ? topSource.source.toLowerCase() : '—'}
          icon={Globe}
          description={topSource ? `${topSource.count} articles` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.byCategory.length === 0 && <p className="text-sm text-muted-foreground">No articles yet.</p>}
            {data.byCategory.map((item) => (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{item.category}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">By Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.bySource.length === 0 && <p className="text-sm text-muted-foreground">No articles yet.</p>}
            {data.bySource.map((item) => (
              <div key={item.source} className="flex items-center justify-between text-sm">
                <span className="text-foreground capitalize">{item.source.toLowerCase()}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Recent Articles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      No articles ingested yet.
                    </TableCell>
                  </TableRow>
                )}
                {data.recentItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-md">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-primary hover:underline line-clamp-1"
                      >
                        {item.title}
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.category}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.source.toLowerCase()}
                      {item.sourceDetail ? ` · ${item.sourceDetail}` : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(new Date(item.createdAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Ingest Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Saved</TableHead>
                  <TableHead>Skipped</TableHead>
                  <TableHead>Errors</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentRuns.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      No ingest runs recorded yet — run <code>npm run data:ingest</code> to see history here.
                    </TableCell>
                  </TableRow>
                )}
                {data.recentRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <Badge variant="outline">{run.trigger}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
                    </TableCell>
                    <TableCell>{run.saved}</TableCell>
                    <TableCell>{run.skipped}</TableCell>
                    <TableCell>{run.errors}</TableCell>
                    <TableCell>{durationLabel(run.startedAt, run.finishedAt)}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(new Date(run.startedAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
