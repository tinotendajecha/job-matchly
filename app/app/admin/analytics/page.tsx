'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from '../components/MetricCard';
import { AlertCircle, Users, UserCheck, Activity, Eye, Timer, FileText } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { AdminAnalyticsData, LabelCount } from '../types';
import { formatNumber } from '../lib/utils';

const AXIS = 'hsl(var(--muted-foreground))';
const GRID = 'hsl(var(--border))';
const TOOLTIP = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};
const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function ChartCard({
  title,
  subtitle,
  children,
  empty,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <Card className="bg-card border-border w-full min-w-0">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-2">
        {empty ? (
          <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
            No data yet for this period.
          </div>
        ) : (
          <div className="w-full overflow-hidden">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

/** Horizontal ranked list — clearer than a bar chart for long text labels. */
function RankedList({ rows, total, emptyText }: { rows: LabelCount[]; total: number; emptyText: string }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyText}</p>;
  }
  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const pct = total > 0 ? (r.count / total) * 100 : 0;
        return (
          <div key={r.label} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-foreground truncate font-mono text-xs">{r.label}</span>
              <span className="text-muted-foreground flex-shrink-0">{formatNumber(r.count)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(pct, 2)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState('30');
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/analytics?days=${days}`, { cache: 'no-store' });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Failed to load analytics');
        if (!cancelled) setData(json.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
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
        <Skeleton className="h-9 w-48" />
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
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  const { growth, engagement, activity, traffic, meta } = data;
  const noTraffic = traffic.totalViews === 0;
  const trackingSince = meta.trackingSince
    ? new Date(meta.trackingSince).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const medianLabel =
    engagement.medianHoursToFirstDoc === null
      ? '—'
      : engagement.medianHoursToFirstDoc < 1
        ? `${Math.round(engagement.medianHoursToFirstDoc * 60)} min`
        : engagement.medianHoursToFirstDoc < 48
          ? `${engagement.medianHoursToFirstDoc.toFixed(1)} hrs`
          : `${(engagement.medianHoursToFirstDoc / 24).toFixed(1)} days`;

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Growth, engagement and website traffic</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
        </TabsList>

        {/* ---------------- Growth ---------------- */}
        <TabsContent value="growth" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Users" value={formatNumber(growth.totalUsers)} icon={Users} />
            <MetricCard
              title={`New in ${meta.windowDays}d`}
              value={formatNumber(growth.dailySignups.reduce((s, d) => s + d.count, 0))}
              icon={UserCheck}
            />
            <MetricCard
              title="Activated"
              value={formatNumber(engagement.activatedUsers)}
              icon={FileText}
              description="Created at least one document"
            />
            <MetricCard title="Median time to 1st doc" value={medianLabel} icon={Timer} />
          </div>

          <ChartCard title="Cumulative Users" subtitle={`Total account count over the last ${meta.windowDays} days`}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={growth.cumulativeUsers} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="date" stroke={AXIS} fontSize={10} angle={-45} textAnchor="end" height={55} />
                <YAxis stroke={AXIS} fontSize={10} />
                <Tooltip contentStyle={TOOLTIP} />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Signups per Day">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={growth.dailySignups} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="date" stroke={AXIS} fontSize={10} angle={-45} textAnchor="end" height={55} />
                <YAxis stroke={AXIS} fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="count" name="signups" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

        {/* ---------------- Engagement ---------------- */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Documents by Type" subtitle="All time">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={engagement.featureUsage} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="type" stroke={AXIS} fontSize={10} angle={-25} textAnchor="end" height={60} />
                  <YAxis stroke={AXIS} fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Documents per User" subtitle={`Across all ${formatNumber(growth.totalUsers)} accounts`}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={engagement.docsPerUser} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="range" stroke={AXIS} fontSize={10} />
                  <YAxis stroke={AXIS} fontSize={10} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard
            title="Time to First Document"
            subtitle={`How long after signing up users create something. Median ${medianLabel}. Counts the ${formatNumber(engagement.activatedUsers)} users who ever created one.`}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={engagement.timeToFirstDoc} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="range" stroke={AXIS} fontSize={10} />
                <YAxis stroke={AXIS} fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="count" fill="hsl(var(--chart-3))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard title="Active today" value={formatNumber(activity.dau)} icon={Activity} />
            <MetricCard title="Active this week" value={formatNumber(activity.wau)} icon={Activity} />
            <MetricCard title="Active this month" value={formatNumber(activity.mau)} icon={Activity} />
          </div>

          <ChartCard
            title="Active Users per Day"
            subtitle="Counts logins, not app usage — someone who stays signed in for a week is counted once, on the day they signed in."
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={activity.dailyActive} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="date" stroke={AXIS} fontSize={10} angle={-45} textAnchor="end" height={55} />
                <YAxis stroke={AXIS} fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Line type="monotone" dataKey="count" name="active" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

        {/* ---------------- Traffic ---------------- */}
        <TabsContent value="traffic" className="space-y-4">
          {trackingSince ? (
            <p className="text-xs text-muted-foreground">
              Tracking started {trackingSince}. Records are anonymous (no IP address) and kept for about 90 days,
              so earlier periods are empty by design rather than zero traffic.
            </p>
          ) : (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertTitle>No page views recorded yet</AlertTitle>
              <AlertDescription>
                Tracking is live but hasn&apos;t captured a visit yet. Charts fill in as people browse the site.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Page Views" value={formatNumber(traffic.totalViews)} icon={Eye} />
            <MetricCard title="Unique Visitors" value={formatNumber(traffic.uniqueVisitors)} icon={Users} />
            <MetricCard
              title="Views per Visitor"
              value={traffic.uniqueVisitors ? (traffic.totalViews / traffic.uniqueVisitors).toFixed(1) : '—'}
              icon={Activity}
            />
            <MetricCard title="Top Page" value={traffic.topPages[0]?.label ?? '—'} icon={FileText} />
          </div>

          <ChartCard title="Views & Unique Visitors" empty={noTraffic}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis
                  dataKey="date"
                  type="category"
                  allowDuplicatedCategory={false}
                  stroke={AXIS}
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={55}
                />
                <YAxis stroke={AXIS} fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line data={traffic.viewsByDay} dataKey="count" name="Views" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                <Line data={traffic.uniqueByDay} dataKey="count" name="Visitors" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="bg-card border-border">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-base sm:text-lg">Most Visited Pages</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Record ids are grouped as [id]</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-2">
                <RankedList rows={traffic.topPages} total={traffic.totalViews} emptyText="No page views yet." />
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-base sm:text-lg">Where Visitors Come From</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">&quot;Direct&quot; means typed in or no referrer</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-2">
                <RankedList rows={traffic.referrers} total={traffic.totalViews} emptyText="No referrers yet." />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Devices" empty={noTraffic}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={traffic.devices} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
                    {traffic.devices.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <Card className="bg-card border-border">
              <CardHeader className="p-4 sm:p-6 pb-2">
                <CardTitle className="text-base sm:text-lg">Countries</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-2">
                <RankedList rows={traffic.countries} total={traffic.totalViews} emptyText="No country data yet." />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
