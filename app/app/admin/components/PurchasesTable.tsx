'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminPurchaseRow } from '../types';
import { formatDateTime } from '../lib/utils';
import { formatMinorCurrency } from '@/lib/market/config';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PurchasesTableProps {
  purchases: AdminPurchaseRow[];
}

const STATUS_CLASS: Record<AdminPurchaseRow['status'], string> = {
  PAID: 'bg-primary/10 text-primary border-primary/20',
  PENDING: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
  CANCELED: 'bg-muted text-muted-foreground border-border',
  BONUS: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
};

export function PurchasesTable({ purchases }: PurchasesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.max(1, Math.ceil(purchases.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPurchases = purchases.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Market</TableHead>
              <TableHead className="text-muted-foreground">Provider</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPurchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No purchases match this filter.
                </TableCell>
              </TableRow>
            )}
            {currentPurchases.map((purchase) => (
              <TableRow key={purchase.id} className="hover:bg-muted">
                <TableCell>
                  <div className="font-medium text-foreground">{purchase.userName}</div>
                  <div className="text-sm text-muted-foreground">{purchase.userEmail}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {purchase.type === 'RESUME_DOWNLOAD_UNLOCK' ? 'Download unlock' : 'Bonus grant'}
                </TableCell>
                <TableCell className="font-bold text-foreground whitespace-nowrap">
                  {/* amountMinor is in cents — formatMinorCurrency does the /100 */}
                  {formatMinorCurrency(
                    purchase.amountMinor,
                    purchase.currency,
                    purchase.market === 'ZA' ? 'en-ZA' : 'en-US'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_CLASS[purchase.status]}>
                    {purchase.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{purchase.market}</TableCell>
                <TableCell>
                  <Badge className="bg-muted text-muted-foreground border-border">{purchase.provider}</Badge>
                </TableCell>
                <TableCell className="text-foreground whitespace-nowrap">
                  {formatDateTime(new Date(purchase.createdAt))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {purchases.length === 0
            ? 'No purchases'
            : `Showing ${startIndex + 1} to ${Math.min(endIndex, purchases.length)} of ${purchases.length}`}
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
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
