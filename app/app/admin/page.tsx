'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from './components/MetricCard';
import { RecentActivity } from './components/RecentActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatCurrency, formatPercentage, calculateTrend } from './lib/utils';
import {
  Users,
  UserCheck,
  UserPlus,
  FileText,
  FilePlus,
  DollarSign,
  CreditCard,
  Zap,
  Target,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AdminOverviewData } from './types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminDashboard() {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/admin/overview', {
          cache: 'no-store',
        });

        const json = await response.json();

        if (!json.ok) {
          throw new Error(json.error || 'Failed to fetch data');
        }

        setData(json.data);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-8 w-full min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Dashboard Overview</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Monitor your SaaS metrics and performance</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="break-words">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const { metrics, charts, recentActivity } = data;

  return (
    <div className="space-y-6 sm:space-y-8 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Dashboard Overview</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Monitor your SaaS metrics and performance</p>
      </div>

      {/* First Row - Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <MetricCard
          title="Total Users"
          value={formatNumber(metrics.totalUsers)}
          icon={Users}
          trend={calculateTrend(metrics.totalUsers, metrics.totalUsers - metrics.newSignupsToday)}
        />
        <MetricCard
          title="Active Users"
          value={formatNumber(metrics.activeUsers)}
          icon={UserCheck}
          description="Last 30 days"
        />
        <MetricCard
          title="New Signups Today"
          value={formatNumber(metrics.newSignupsToday)}
          icon={UserPlus}
          trend={calculateTrend(metrics.newSignupsToday, 2)}
        />
        <MetricCard
          title="Total Documents"
          value={formatNumber(metrics.totalDocuments)}
          icon={FileText}
          trend={calculateTrend(metrics.totalDocuments, metrics.totalDocuments - metrics.documentsToday)}
        />
      </div>

      {/* Second Row - Revenue & Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <MetricCard
          title="Documents Today"
          value={formatNumber(metrics.documentsToday)}
          icon={FilePlus}
          trend={calculateTrend(metrics.documentsToday, 8)}
        />
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.mrr)}
          icon={DollarSign}
          trend={calculateTrend(metrics.mrr, metrics.mrr * 0.85)}
        />
        <MetricCard
          title="Total Credits Purchased"
          value={formatNumber(metrics.totalCreditsPurchased)}
          icon={CreditCard}
        />
        <MetricCard
          title="Credits Used This Month"
          value={formatNumber(metrics.creditsUsedThisMonth)}
          icon={Zap}
          description={`${formatPercentage(metrics.creditsUsedThisMonth, metrics.totalCreditsPurchased)} of total`}
        />
      </div>

      {/* Third Row - Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <MetricCard
          title="Activation Rate"
          value={`${metrics.activationRate.toFixed(1)}%`}
          icon={Target}
          description="Users who created 1+ document"
        />
        <MetricCard
          title="Churn Rate"
          value={`${metrics.churnRate.toFixed(1)}%`}
          icon={TrendingDown}
          description="Inactive users"
        />
        <MetricCard title="Avg Docs per User" value={metrics.avgDocsPerUser.toFixed(1)} icon={FileText} />
        <MetricCard title="Avg Credits per User" value={metrics.avgCreditsPerUser.toFixed(0)} icon={CreditCard} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full">
        <Card className="bg-card border-border w-full min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg truncate">Daily Signups (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <LineChart data={charts.dailySignups} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="signups" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border w-full min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg truncate">Active Users Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <LineChart data={charts.activeUsers} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="active" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full">
        <Card className="bg-card border-border w-full min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg truncate">Documents by Type</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <BarChart data={charts.documentsByType} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="type"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border w-full min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg truncate">Revenue Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={250} minWidth={0}>
                <AreaChart data={charts.revenueTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      {/* Bottom Row - Fixed Heights */}
      {/* Bottom Row - Fixed User Distribution */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 w-full items-start">
  {/* User Distribution - Fixed Height & Better Labels */}
  <Card className="bg-card border-border w-full min-w-0 lg:h-full lg:max-h-[500px]">
    <CardHeader className="p-4 sm:p-6">
      <CardTitle className="text-base sm:text-lg truncate">User Distribution</CardTitle>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 pt-0">
      <div className="w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={250} minWidth={0}>
          <PieChart>
            <Pie
              data={charts.userDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {charts.userDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry: any) => {
                const total = charts.userDistribution.reduce((sum, item) => sum + item.value, 0);
                const percentage = ((entry.value / total) * 100).toFixed(0);
                return `${value}: ${entry.value} (${percentage}%)`;
              }}
              wrapperStyle={{
                fontSize: '12px',
                paddingTop: '10px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>

  {/* Recent Activity */}
  <div className="lg:col-span-2 w-full min-w-0">
    <RecentActivity activities={recentActivity} limit={10} />
  </div>
</div>


    </div>
  );
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 w-full min-w-0 overflow-x-hidden">
      <div className="min-w-0">
        <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-2" />
        <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border-border w-full">
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 mb-3 sm:mb-4" />
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-24 mb-2" />
              <Skeleton className="h-2.5 sm:h-3 w-32 sm:w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border-border w-full">
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 mb-3 sm:mb-4" />
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-24 mb-2" />
              <Skeleton className="h-2.5 sm:h-3 w-32 sm:w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 w-full">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="bg-card border-border w-full">
            <CardHeader className="p-4 sm:p-6">
              <Skeleton className="h-5 sm:h-6 w-36 sm:w-48" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
