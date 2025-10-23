'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Document } from '../lib/mockData';
import { formatDateTime } from '../lib/utils';
import { Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface DocumentsTableProps {
  documents: Document[];
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocuments = documents.slice(startIndex, endIndex);

  const getDocumentTypeClass = (kind: Document['kind']) => {
    switch (kind) {
      case 'TAILORED_RESUME':
        return 'bg-chart-1/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/20';
      case 'COVER_LETTER':
        return 'bg-chart-2/10 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/20';
      case 'CREATED_RESUME':
        return 'bg-chart-3/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20';
    }
  };

  const formatDocumentKind = (kind: Document['kind']) => {
    return kind.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Document Title</TableHead>
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Created Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentDocuments.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-muted">
                <TableCell className="font-medium text-foreground max-w-xs truncate">
                  {doc.title}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-foreground">{doc.userName}</div>
                    <div className="text-sm text-muted-foreground">{doc.userEmail}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getDocumentTypeClass(doc.kind)}>
                    {formatDocumentKind(doc.kind)}
                  </Badge>
                </TableCell>
                <TableCell className="text-foreground">{formatDateTime(doc.createdAt)}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      doc.status === 'completed'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    }
                  >
                    {doc.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, documents.length)} of {documents.length} documents
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
