'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from '../lib/mockData';
import { formatDate, formatRelativeTime } from '../lib/utils';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface UsersTableProps {
  users: User[];
  onViewDetails: (user: User) => void;
}

export function UsersTable({ users, onViewDetails }: UsersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Signup Date</TableHead>
              <TableHead className="text-muted-foreground">Credits</TableHead>
              <TableHead className="text-muted-foreground">Documents</TableHead>
              <TableHead className="text-muted-foreground">Last Active</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Onboarded</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {user.credits} credits
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground">{user.documentsCreated}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRelativeTime(user.lastActive)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      user.status === 'ACTIVE'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      user.onboardingComplete
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20'
                    }
                  >
                    {user.onboardingComplete ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(user)}
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, users.length)} of {users.length} users
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
