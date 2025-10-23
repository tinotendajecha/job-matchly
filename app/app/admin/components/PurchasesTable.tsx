'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Purchase } from '../lib/mockData';
import { formatDateTime, formatCurrency } from '../lib/utils';
import { Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface PurchasesTableProps {
  purchases: Purchase[];
}

export function PurchasesTable({ purchases }: PurchasesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(purchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPurchases = purchases.slice(startIndex, endIndex);

  const getStatusClass = (status: Purchase['status']) => {
    switch (status) {
      case 'PAID':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20';
      case 'FAILED':
        return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Transaction ID</TableHead>
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Credits</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Provider</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPurchases.map((purchase) => (
              <TableRow key={purchase.id} className="hover:bg-muted">
                <TableCell className="font-mono text-sm text-foreground">
                  {purchase.id}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-foreground">{purchase.userName}</div>
                    <div className="text-sm text-muted-foreground">{purchase.userEmail}</div>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-foreground">
                  {formatCurrency(purchase.amount)}
                </TableCell>
                <TableCell>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {purchase.credits} credits
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusClass(purchase.status)}>
                    {purchase.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-muted text-muted-foreground border-border">
                    {purchase.provider}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground">{formatDateTime(purchase.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    {purchase.status === 'PAID' && (
                      <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                        <RefreshCw className="h-4 w-4" />
                        Refund
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, purchases.length)} of {purchases.length} purchases
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
