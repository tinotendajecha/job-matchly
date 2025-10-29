'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { DocumentsTable } from '../components/DocumentsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, FilePlus, FileCheck, User } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DocumentListItem, DocumentStats, DocumentPagination } from '../types'; // Update: import your new types

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tailored' | 'cover' | 'created'>('all');
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [pagination, setPagination] = useState<DocumentPagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch analytics/stats
  useEffect(() => {
    async function getStats() {
      const res = await fetch('/api/admin/documents/analytics');
      const json = await res.json();
      if (json.ok) setStats(json.data);
    }
    getStats();
  }, []);

  // Fetch paginated docs
  useEffect(() => {
    async function fetchDocs() {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(filterType !== 'all' && { kind: filterType }),
      });
      const res = await fetch(`/api/admin/documents?${params}`);
      const json = await res.json();
      if (json.ok) {
        setDocs(json.data.documents);
        setPagination(json.data.pagination);
      }
      setLoading(false);
    }
    fetchDocs();
  }, [page, search, filterType]);

  // Reset page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [search, filterType]);

  return (
    <div className="space-y-8 w-full min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Document Activity</h1>
        <p className="text-muted-foreground mt-1">Track all documents created on the platform</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Documents" value={stats ? stats.totalDocuments : '--'} icon={FileText} />
        <MetricCard title="Created Today" value={stats ? stats.documentsToday : '--'} icon={FilePlus} />
        <MetricCard title="Created This Week" value={stats ? stats.documentsThisWeek : '--'} icon={FileCheck} />
        <MetricCard title="Average per User" value={stats ? stats.avgPerUser : '--'} icon={User} />
      </div>

      {/* Type breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tailored Resumes</CardTitle>
            <FileText className="h-4 w-4 text-[hsl(var(--chart-1))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.statsByType.tailored ?? '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Most popular feature</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cover Letters</CardTitle>
            <FileText className="h-4 w-4 text-[hsl(var(--chart-2))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.statsByType.cover ?? '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Second most used</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created Resumes</CardTitle>
            <FileText className="h-4 w-4 text-[hsl(var(--chart-3))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.statsByType.created ?? 0}
            </div>
            <Badge className="mt-1 bg-secondary text-secondary-foreground border-border">
              Coming Soon
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Documents Created Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="tailored"
                stackId="1"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="cover"
                stackId="1"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="created"
                stackId="1"
                stroke="hsl(var(--chart-3))"
                fill="hsl(var(--chart-3))"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table & controls */}
      <Card className="bg-card border-border w-full min-w-0">
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Search by title or user email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-input border-input"
              />
            </div>
            <Select value={filterType} onValueChange={val => setFilterType(val as any)}>
              <SelectTrigger className="w-full sm:w-[200px] bg-input border-input">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="tailored">Tailored Resumes</SelectItem>
                <SelectItem value="cover">Cover Letters</SelectItem>
                <SelectItem value="created">Created Resumes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DocumentsTable
            documents={docs}
            loading={loading}
            pagination={pagination!}
            currentPage={page}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
