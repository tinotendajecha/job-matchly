'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { UserListItem, PaginationInfo } from '../types';
import { formatDate, formatRelativeTime } from '../lib/utils';
import { Eye, ChevronLeft, ChevronRight, Mail, Calendar, FileText, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface UsersTableProps {
  users: UserListItem[];
  onViewDetails: (user: UserListItem) => void;
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function UsersTable({ users, onViewDetails, pagination, currentPage, onPageChange }: UsersTableProps) {
  const { totalPages, totalCount } = pagination;
  const startIndex = (currentPage - 1) * pagination.limit + 1;
  const endIndex = Math.min(currentPage * pagination.limit, totalCount);

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Signup Date</TableHead>
              <TableHead className="text-muted-foreground">Credits</TableHead>
              <TableHead className="text-muted-foreground">Documents</TableHead>
              <TableHead className="text-muted-foreground">Last Active</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted">
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-foreground truncate">{user.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground whitespace-nowrap">{formatDate(typeof user.createdAt === 'string' ? new Date(user.createdAt) : user.createdAt)}</TableCell>
                  <TableCell>
                    <Badge className="bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
                      {user.credits} credits
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{user.documentsCreated}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(typeof user.lastActive === 'string' ? new Date(user.lastActive) : user.lastActive)}
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
                        user.isPaid
                          ? 'bg-chart-1/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }
                    >
                      {user.isPaid ? 'Paid' : 'Free'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(user)} className="gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {users.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center text-muted-foreground">No users found</CardContent>
          </Card>
        ) : (
          users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-card border-border hover:bg-muted transition-colors">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* User Header */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{user.name}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <p className="truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Badge
                          className={cn(
                            'text-xs',
                            user.status === 'ACTIVE'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-muted text-muted-foreground border-border'
                          )}
                        >
                          {user.status}
                        </Badge>
                        <Badge
                          className={cn(
                            'text-xs',
                            user.isPaid
                              ? 'bg-chart-1/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/20'
                              : 'bg-muted text-muted-foreground border-border'
                          )}
                        >
                          {user.isPaid ? 'Paid' : 'Free'}
                        </Badge>
                      </div>
                    </div>

                    {/* User Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Credits</p>
                          <p className="text-sm font-medium text-foreground">{user.credits}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Documents</p>
                          <p className="text-sm font-medium text-foreground">{user.documentsCreated}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Joined</p>
                          <p className="text-sm font-medium text-foreground truncate">{formatDate(typeof user.createdAt === 'string' ? new Date(user.createdAt) : user.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Last Active</p>
                          <p className="text-sm font-medium text-foreground truncate">
                            {formatRelativeTime(typeof user.lastActive === 'string' ? new Date(user.lastActive) : user.lastActive)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(user)}
                      className="w-full gap-2 mt-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
            Showing {startIndex} to {endIndex} of {totalCount} users
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Desktop Page Numbers */}
            <div className="hidden md:flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
let pageNum: number = 1; // or any default number
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-9 h-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            {/* Mobile Page Counter */}
            <div className="md:hidden text-sm text-muted-foreground px-2">
              {currentPage} / {totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
