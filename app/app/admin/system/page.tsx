'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '../lib/utils';
import { Server, Database, Cpu, CreditCard, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SystemError {
  id: string;
  type: string;
  message: string;
  user?: string;
  timestamp: Date;
  status: 'open' | 'resolved';
}

interface ActivityLog {
  id: string;
  timestamp: Date;
  eventType: string;
  user: string;
  details: string;
  ipAddress: string;
}

export default function SystemPage() {
  const mockErrors: SystemError[] = [
    {
      id: 'err-1',
      type: 'API Error',
      message: 'Rate limit exceeded',
      user: 'user1@example.com',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'resolved',
    },
    {
      id: 'err-2',
      type: 'Database Error',
      message: 'Connection timeout',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'resolved',
    },
    {
      id: 'err-3',
      type: 'AI Service',
      message: 'Generation failed',
      user: 'user5@example.com',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      status: 'open',
    },
  ];

  const mockActivityLogs: ActivityLog[] = Array.from({ length: 20 }, (_, i) => ({
    id: `log-${i + 1}`,
    timestamp: new Date(Date.now() - i * 1000 * 60 * 5),
    eventType: ['User Login', 'Document Created', 'Purchase', 'API Call'][Math.floor(Math.random() * 4)],
    user: `user${i + 1}@example.com`,
    details: 'Successful operation',
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  }));

  const apiResponseData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    time: 150 + Math.random() * 100,
  }));

  const successRateData = [
    { type: 'Resume', rate: 98.5 },
    { type: 'Cover Letter', rate: 99.2 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Health</h1>
        <p className="text-muted-foreground mt-1">Monitor system status, performance, and logs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Operational
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">All systems running</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Healthy
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Query time: 45ms avg</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Service Status</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Response time: 3.2s avg</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Gateway</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Pesepay integration</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Error Type</TableHead>
                  <TableHead className="text-muted-foreground">Message</TableHead>
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockErrors.map((error) => (
                  <TableRow key={error.id} className="hover:bg-muted">
                    <TableCell>
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                        {error.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{error.message}</TableCell>
                    <TableCell className="text-foreground">{error.user || '-'}</TableCell>
                    <TableCell className="text-foreground">{formatDateTime(error.timestamp)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          error.status === 'resolved'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }
                      >
                        {error.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg API Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">185ms</div>
            <p className="text-xs text-muted-foreground mt-1">Within acceptable range</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Query Time</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">45ms</div>
            <p className="text-xs text-muted-foreground mt-1">Excellent performance</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">99.9%</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>API Response Time (24 Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={apiResponseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(0)}ms`}
                />
                <Line type="monotone" dataKey="time" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>AI Generation Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[90, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar dataKey="rate" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground">Event Type</TableHead>
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Details</TableHead>
                  <TableHead className="text-muted-foreground">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockActivityLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted">
                    <TableCell className="text-foreground">{formatDateTime(log.timestamp)}</TableCell>
                    <TableCell>
                      <Badge className="bg-muted text-muted-foreground border-border">
                        {log.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">{log.user}</TableCell>
                    <TableCell className="text-muted-foreground">{log.details}</TableCell>
                    <TableCell className="text-foreground font-mono text-sm">{log.ipAddress}</TableCell>
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
