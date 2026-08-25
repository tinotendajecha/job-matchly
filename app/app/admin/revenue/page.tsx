'use client';

import { MetricCard } from '../components/MetricCard';
import { PurchasesTable } from '../components/PurchasesTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockPurchases } from '../lib/mockData';
import { formatNumber, formatCurrency, formatPercentage } from '../lib/utils';
import { DollarSign, TrendingUp, CheckCircle, CreditCard, FlaskConical } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenuePage() {
  const totalRevenue = mockPurchases
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const mrr = totalRevenue / 6;

  const totalTransactions = mockPurchases.length;
  const successfulTransactions = mockPurchases.filter(p => p.status === 'PAID').length;
  const avgOrderValue = totalRevenue / successfulTransactions;
  const successRate = (successfulTransactions / totalTransactions) * 100;

  const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000);
    const monthRevenue = mockPurchases
      .filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate.getMonth() === month.getMonth() &&
               pDate.getFullYear() === month.getFullYear() &&
               p.status === 'PAID';
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      revenue: monthRevenue + Math.floor(Math.random() * 500) + 1000,
    };
  });

  const revenueByPlan = [
    {
      plan: 'Starter',
      amount: 5,
      count: mockPurchases.filter(p => p.amount === 5 && p.status === 'PAID').length,
      revenue: mockPurchases.filter(p => p.amount === 5 && p.status === 'PAID').length * 5,
    },
    {
      plan: 'Basic',
      amount: 10,
      count: mockPurchases.filter(p => p.amount === 10 && p.status === 'PAID').length,
      revenue: mockPurchases.filter(p => p.amount === 10 && p.status === 'PAID').length * 10,
    },
    {
      plan: 'Pro',
      amount: 20,
      count: mockPurchases.filter(p => p.amount === 20 && p.status === 'PAID').length,
      revenue: mockPurchases.filter(p => p.amount === 20 && p.status === 'PAID').length * 20,
    },
    {
      plan: 'Premium',
      amount: 50,
      count: mockPurchases.filter(p => p.amount === 50 && p.status === 'PAID').length,
      revenue: mockPurchases.filter(p => p.amount === 50 && p.status === 'PAID').length * 50,
    },
  ];

  const paymentStatus = [
    { name: 'Paid', value: mockPurchases.filter(p => p.status === 'PAID').length },
    { name: 'Pending', value: mockPurchases.filter(p => p.status === 'PENDING').length },
    { name: 'Failed', value: mockPurchases.filter(p => p.status === 'FAILED').length },
  ];

  const STATUS_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-4))',
    'hsl(var(--destructive))',
  ];

  const PLAN_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
  ];


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Revenue & Purchases</h1>
        <p className="text-muted-foreground mt-1">Monitor revenue and transactions</p>
      </div>

      <Alert>
        <FlaskConical className="h-4 w-4" />
        <AlertTitle>Preview data</AlertTitle>
        <AlertDescription>
          This tab is not yet connected to live metrics — everything below is sample data for layout purposes only.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
        />
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(mrr)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Average Order Value"
          value={formatCurrency(avgOrderValue)}
          icon={CreditCard}
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon={CheckCircle}
          description={`${successfulTransactions} of ${totalTransactions} transactions`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByPlan.filter(p => p.revenue > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, revenue }) => `${plan}: ${formatCurrency(revenue)}`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {revenueByPlan.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Payment Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Transactions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatNumber(mockPurchases.filter(p => p.status === 'PAID').length)}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{((mockPurchases.filter(p => p.status === 'PAID').length / mockPurchases.length) * 100).toFixed(1)}%</div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(mockPurchases.filter(p => p.status === 'PAID').length / mockPurchases.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>All Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchasesTable purchases={mockPurchases} />
        </CardContent>
      </Card>
    </div>
  );
}
