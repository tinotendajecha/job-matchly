'use client';

import { useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import { UsersTable } from '../components/UsersTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockUsers, User } from '../lib/mockData';
import { formatNumber, formatDate } from '../lib/utils';
import { Users, UserCheck, UserPlus, UserX, Search, Download } from 'lucide-react';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const totalUsers = mockUsers.length;
  const activeThisMonth = mockUsers.filter(u => u.status === 'ACTIVE').length;
  const newThisWeek = mockUsers.filter(u => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(u.createdAt) > weekAgo;
  }).length;
  const churnedThisMonth = mockUsers.filter(u => u.status === 'INACTIVE').length;

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.status === 'ACTIVE') ||
      (filterStatus === 'inactive' && user.status === 'INACTIVE') ||
      (filterStatus === 'free' && !user.isPaid) ||
      (filterStatus === 'paid' && user.isPaid);

    return matchesSearch && matchesFilter;
  });

  const handleExport = () => {
    console.log('TODO: Export users to CSV');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage and monitor all platform users</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={formatNumber(totalUsers)}
          icon={Users}
        />
        <MetricCard
          title="Active This Month"
          value={formatNumber(activeThisMonth)}
          icon={UserCheck}
        />
        <MetricCard
          title="New This Week"
          value={formatNumber(newThisWeek)}
          icon={UserPlus}
        />
        <MetricCard
          title="Churned This Month"
          value={formatNumber(churnedThisMonth)}
          icon={UserX}
        />
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-input border-input"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px] bg-input border-input">
                <SelectValue placeholder="Filter users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <UsersTable users={filteredUsers} onViewDetails={setSelectedUser} />
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-foreground">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="text-foreground font-mono text-sm">{selectedUser.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-foreground">{selectedUser.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credits</label>
                  <p className="text-foreground">{selectedUser.credits}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Documents Created</label>
                  <p className="text-foreground">{selectedUser.documentsCreated}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signup Date</label>
                  <p className="text-foreground">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Active</label>
                  <p className="text-foreground">{formatDate(selectedUser.lastActive)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                  <p className="text-foreground">{selectedUser.isPaid ? 'Paid' : 'Free'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Onboarding</label>
                  <p className="text-foreground">{selectedUser.onboardingComplete ? 'Complete' : 'Incomplete'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
