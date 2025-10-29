'use client';

import { useState, useEffect } from 'react';
import { MetricCard } from '../components/MetricCard';
import { UsersTable } from '../components/UsersTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatNumber, formatDate } from '../lib/utils';
import { Users, UserCheck, UserPlus, UserX, Search, Download, AlertCircle, Loader2 } from 'lucide-react';
import { UsersResponse, UserListItem, UserDetailResponse } from '../types';
import { useDebounce } from '@/hooks/use-debounce';

export default function UsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAccountType, setFilterAccountType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '20',
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(filterStatus !== 'all' && { status: filterStatus }),
          ...(filterAccountType !== 'all' && { accountType: filterAccountType }),
        });

        const response = await fetch(`/api/admin/users?${params}`, {
          cache: 'no-store',
        });

        const json = await response.json();

        if (!json.ok) {
          throw new Error(json.error || 'Failed to fetch users');
        }

        setData(json.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [currentPage, debouncedSearch, filterStatus, filterAccountType]);

  // Fetch user details
  const handleViewDetails = async (user: UserListItem) => {
    setSelectedUser(user);
    setLoadingDetail(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`);
      const json = await response.json();

      if (json.ok) {
        setUserDetail(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '10000',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterAccountType !== 'all' && { accountType: filterAccountType }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const json = await response.json();

      if (!json.ok) throw new Error('Export failed');

      // Convert to CSV
      const users = json.data.users;
      const headers = ['ID', 'Name', 'Email', 'Credits', 'Documents', 'Status', 'Account Type', 'Signup Date'];
      const csvRows = [
        headers.join(','),
        ...users.map((u: UserListItem) =>
          [
            u.id,
            `"${u.name}"`,
            u.email,
            u.credits,
            u.documentsCreated,
            u.status,
            u.isPaid ? 'Paid' : 'Free',
            formatDate(typeof u.createdAt === 'string' ? new Date(u.createdAt) : u.createdAt),
          ].join(',')
        ),
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString()}.csv`;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterStatus, filterAccountType]);

  if (error) {
    return (
      <div className="space-y-6 sm:space-y-8 w-full min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">User Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage and monitor all platform users</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading && !data) {
    return <UsersPageSkeleton />;
  }

  const stats = data?.stats || { totalUsers: 0, activeThisMonth: 0, newThisWeek: 0, churnedThisMonth: 0 };
  const users = data?.users || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, totalCount: 0, hasMore: false, limit:5 };

  return (
    <div className="space-y-6 sm:space-y-8 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">User Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage and monitor all platform users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <MetricCard title="Total Users" value={formatNumber(stats.totalUsers)} icon={Users} />
        <MetricCard title="Active This Month" value={formatNumber(stats.activeThisMonth)} icon={UserCheck} />
        <MetricCard title="New This Week" value={formatNumber(stats.newThisWeek)} icon={UserPlus} />
        <MetricCard title="Churned This Month" value={formatNumber(stats.churnedThisMonth)} icon={UserX} />
      </div>

      {/* Users Table Card */}
      <Card className="bg-card border-border w-full min-w-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-input border-input"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px] bg-input border-input">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAccountType} onValueChange={setFilterAccountType}>
                <SelectTrigger className="w-full sm:w-[180px] bg-input border-input">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExport} className="gap-2 w-full sm:w-auto">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Table */}
          {!loading && (
            <UsersTable
              users={users}
              onViewDetails={handleViewDetails}
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={() => {
          setSelectedUser(null);
          setUserDetail(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {loadingDetail && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!loadingDetail && selectedUser && userDetail && (
            <UserDetailView user={selectedUser} detail={userDetail} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// User Detail View Component
function UserDetailView({ user, detail }: { user: UserListItem; detail: UserDetailResponse }) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoField label="Name" value={detail.user.name || 'N/A'} />
          <InfoField label="Email" value={detail.user.email || 'N/A'} />
          <InfoField label="User ID" value={detail.user.id} mono />
          <InfoField label="Status" value={user.status} />
          <InfoField label="Credits" value={detail.user.credits.toString()} />
          <InfoField label="Documents Created" value={detail.user.totalDocuments.toString()} />
          <InfoField label="Signup Date" value={formatDate(typeof detail.user.createdAt === 'string' ? new Date(detail.user.createdAt) : detail.user.createdAt)} />
          <InfoField label="Last Active" value={formatDate(typeof detail.user.lastActive === 'string' ? new Date(detail.user.lastActive) : detail.user.lastActive)} />
          <InfoField label="Account Type" value={user.isPaid ? 'Paid' : 'Free'} />
          <InfoField label="Onboarding" value={detail.user.onboardingComplete ? 'Complete' : 'Incomplete'} />
          <InfoField label="Email Verified" value={detail.user.emailVerified ? 'Yes' : 'No'} />
        </div>
      </div>

      {/* Recent Documents */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Documents ({detail.documents.length})</h3>
        {detail.documents.length > 0 ? (
          <div className="space-y-2">
            {detail.documents.map((doc) => (
              <div key={doc.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{doc.title || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground">{doc.kind.replace(/_/g, ' ')}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatDate(typeof doc.createdAt === 'string' ? new Date(doc.createdAt) : doc.createdAt)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No documents yet</p>
        )}
      </div>

      {/* Purchase History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Purchase History ({detail.purchases.length})</h3>
        {detail.purchases.length > 0 ? (
          <div className="space-y-2">
            {detail.purchases.map((purchase) => (
              <div key={purchase.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">${purchase.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {purchase.credits} credits • {purchase.status}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(typeof purchase.createdAt === 'string' ? new Date(purchase.createdAt) : purchase.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No purchases yet</p>
        )}
      </div>

      {/* Credit History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Credit History ({detail.creditHistory.length})</h3>
        {detail.creditHistory.length > 0 ? (
          <div className="space-y-2">
            {detail.creditHistory.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold ${item.credits > 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {item.credits > 0 ? '+' : ''}
                    {item.credits}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No credit history</p>
        )}
      </div>
    </div>
  );
}

function InfoField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <p className={`text-foreground ${mono ? 'font-mono text-sm' : ''} break-words`}>{value}</p>
    </div>
  );
}

function UsersPageSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 w-full min-w-0">
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

      <Card className="bg-card border-border w-full">
        <CardHeader className="p-4 sm:p-6">
          <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
