'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Download, ChevronLeft, ChevronRight, FileText, Mail } from 'lucide-react';
import { DocumentListItem, DocumentPagination } from '../types';
import { formatDateTime } from '../lib/utils';

interface DocumentsTableProps {
  documents: DocumentListItem[];
  loading?: boolean;
  pagination: DocumentPagination | null;
  currentPage: number;
  onPageChange: (p: number) => void;
}

export function DocumentsTable({
  documents,
  loading,
  pagination,
  currentPage,
  onPageChange,
}: DocumentsTableProps) {
  const { totalPages = 1, totalCount = 0, limit = 20 } = pagination || {};
  const startIndex = (currentPage - 1) * limit + 1;
  const endIndex = Math.min(currentPage * limit, totalCount);

  const getDocumentTypeClass = (kind: string) => {
    switch (kind) {
      case 'TAILORED_RESUME':
        return 'bg-chart-1/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/20';
      case 'COVER_LETTER':
        return 'bg-chart-2/10 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/20';
      case 'CREATED_RESUME':
        return 'bg-chart-3/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20';
      default:
        return '';
    }
  };

  const formatDocumentKind = (kind: string) =>
    kind.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  // Desktop Table
  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Desktop Table */}
      <div className="hidden lg:block rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Title</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16">
                  <span className="text-muted-foreground">Loading...</span>
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              documents.map(doc => (
                <TableRow key={doc.id} className="hover:bg-muted">
                  <TableCell className="font-medium text-foreground max-w-xs truncate">{doc.title}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{doc.userName}</div>
                      <div className="text-sm text-muted-foreground">{doc.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getDocumentTypeClass(doc.kind)}>
                      {formatDocumentKind(doc.kind)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{formatDateTime(typeof doc.createdAt === 'string' ? new Date(doc.createdAt) : doc.createdAt)}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile List */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground py-16">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No documents found</div>
        ) : (
          documents.map(doc => (
            <div key={doc.id} className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-1">
                <FileText className="h-7 w-7 text-[hsl(var(--chart-1))]" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">{doc.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{doc.userEmail}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <Badge className={getDocumentTypeClass(doc.kind)}>
                  {formatDocumentKind(doc.kind)}
                </Badge>
                <span className="ml-auto text-muted-foreground">{formatDateTime(typeof doc.createdAt === 'string' ? new Date(doc.createdAt) : doc.createdAt)}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="w-full gap-1 rounded">
                  <Eye className="h-4 w-4" /> View
                </Button>
                <Button variant="outline" size="sm" className="w-full gap-1 rounded">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
            Showing {startIndex} to {endIndex} of {totalCount} documents
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
