'use client';

import { useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { DocumentsTable } from '../components/DocumentsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockDocuments, DocumentKind } from '../lib/mockData';
import { formatNumber } from '../lib/utils';
import { FileText, FilePlus, FileCheck, User } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const totalDocuments = mockDocuments.length;
  const documentsToday = mockDocuments.filter(d => {
    const today = new Date();
    const createdDate = new Date(d.createdAt);
    return createdDate.toDateString() === today.toDateString();
  }).length;

  const documentsThisWeek = mockDocuments.filter(d => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(d.createdAt) > weekAgo;
  }).length;

  const avgPerUser = (totalDocuments / 150).toFixed(1);

  const tailoredResumes = mockDocuments.filter(d => d.kind === 'TAILORED_RESUME').length;
  const coverLetters = mockDocuments.filter(d => d.kind === 'COVER_LETTER').length;
  const createdResumes = 0;

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.userEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'tailored' && doc.kind === 'TAILORED_RESUME') ||
      (filterType === 'cover' && doc.kind === 'COVER_LETTER') ||
      (filterType === 'created' && doc.kind === 'CREATED_RESUME');

    return matchesSearch && matchesFilter;
  });

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
    const docsOnDate = mockDocuments.filter(d => {
      const docDate = new Date(d.createdAt);
      return docDate.toDateString() === date.toDateString();
    });

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tailored: docsOnDate.filter(d => d.kind === 'TAILORED_RESUME').length,
      cover: docsOnDate.filter(d => d.kind === 'COVER_LETTER').length,
      created: 0,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Document Activity</h1>
        <p className="text-muted-foreground mt-1">Track all documents created on the platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Documents"
          value={formatNumber(totalDocuments)}
          icon={FileText}
        />
        <MetricCard
          title="Created Today"
          value={formatNumber(documentsToday)}
          icon={FilePlus}
        />
        <MetricCard
          title="Created This Week"
          value={formatNumber(documentsThisWeek)}
          icon={FileCheck}
        />
        <MetricCard
          title="Average per User"
          value={avgPerUser}
          icon={User}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tailored Resumes</CardTitle>
            <FileText className="h-4 w-4 text-[hsl(var(--chart-1))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatNumber(tailoredResumes)}</div>
            <p className="text-xs text-muted-foreground mt-1">Most popular feature</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cover Letters</CardTitle>
            <FileText className="h-4 w-4 text-[hsl(var(--chart-2))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatNumber(coverLetters)}</div>
            <p className="text-xs text-muted-foreground mt-1">Second most used</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created Resumes</CardTitle>
            <FileText className="h-4 w-4 text-[hsl(var(--chart-3))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatNumber(createdResumes)}</div>
            <Badge className="mt-1 bg-secondary text-secondary-foreground border-border">
              Coming Soon
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Documents Created Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={last30Days}>
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

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by title or user email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-input border-input"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
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

          <DocumentsTable documents={filteredDocuments} />
        </CardContent>
      </Card>
    </div>
  );
}
