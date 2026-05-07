'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Loader2,
  Plus,
  Upload,
  Target,
  ChevronRight,
  Trash2,
  Search,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DocumentListItem {
  id: string;
  title: string;
  kind: 'TAILORED_RESUME' | 'CREATED_RESUME' | 'COVER_LETTER' | string;
  market?: string;
  downloadState?: {
    isLocked: boolean;
    canDownload: boolean;
    priceDisplay: string | null;
  };
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

export default function DocumentsPage() {
  const pathname = usePathname();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tailored' | 'cover' | 'created'>('all');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    async function fetchDocs() {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filterType !== 'all' && { kind: filterType }),
      });

      try {
        const res = await fetch(`/api/documents?${params.toString()}`);
        const json = await res.json();
        if (json?.ok) {
          setDocuments(json.documents || []);
          setPagination(json.pagination || null);
        }
      } catch (err) {
        console.error('Failed to fetch documents', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDocs();
  }, [debouncedSearch, filterType, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterType]);

  const totalCountLabel = useMemo(() => {
    if (!pagination) return '...';
    return `${pagination.totalCount} document${pagination.totalCount === 1 ? '' : 's'}`;
  }, [pagination]);

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'TAILORED_RESUME': return 'Tailored Resume';
      case 'CREATED_RESUME': return 'Created Resume';
      case 'COVER_LETTER': return 'Cover Letter';
      default: return 'Document';
    }
  };

  const getKindStyles = (kind: string) => {
    switch (kind) {
      case 'TAILORED_RESUME':
        return { bg: 'bg-blue-500/15', text: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-400 border-0', icon: FileText };
      case 'CREATED_RESUME':
        return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400 border-0', icon: FileText };
      case 'COVER_LETTER':
        return { bg: 'bg-violet-500/15', text: 'text-violet-400', badge: 'bg-violet-500/15 text-violet-400 border-0', icon: Target };
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground', badge: '', icon: FileText };
    }
  };

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Delete failed');
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success('Document deleted');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <AppSidebar />

        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-6xl mx-auto space-y-6">

            {/* Page header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold font-display tracking-tight">My Documents</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{totalCountLabel}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/builder/modern">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Resume
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/app/upload-tailor">
                    <Upload className="h-4 w-4 mr-1.5" />
                    Upload & Tailor
                  </Link>
                </Button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={(val) => setFilterType(val as any)}>
                <SelectTrigger className="w-full sm:w-[180px]">
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

            {/* Documents table */}
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading documents...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No documents found</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/app/upload-tailor">Create your first document</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block">
                    <div className="grid grid-cols-[40px_1fr_160px_140px_80px_48px] px-4 py-2.5 border-b border-border/60 bg-muted/30">
                      <div />
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Document</div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</div>
                      <div />
                      <div />
                    </div>
                    <div className="divide-y divide-border/40">
                      {documents.map((doc) => {
                        const { bg, text, badge, icon: KindIcon } = getKindStyles(doc.kind);
                        return (
                          <div key={doc.id} className="grid grid-cols-[40px_1fr_160px_140px_80px_48px] items-center px-4 py-3.5 hover:bg-muted/30 transition-colors group">
                            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', bg)}>
                              <KindIcon className={cn('h-3.5 w-3.5', text)} />
                            </div>
                            <div className="px-4 min-w-0">
                              <div className="font-medium text-sm truncate">{doc.title || 'Untitled'}</div>
                              {doc.kind === 'TAILORED_RESUME' && doc.downloadState?.isLocked && (
                                <div className="text-xs text-amber-500 mt-0.5">
                                  Pay {doc.downloadState.priceDisplay || ''} to download
                                </div>
                              )}
                              {doc.kind === 'TAILORED_RESUME' && doc.downloadState?.canDownload && (
                                <div className="text-xs text-emerald-500 mt-0.5">Ready to download</div>
                              )}
                            </div>
                            <div>
                              <Badge variant="outline" className={cn('text-[11px] font-medium', badge)}>
                                {getKindLabel(doc.kind)}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                            </div>
                            <div>
                              <Link
                                href={`/app/documents/${doc.id}`}
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                              >
                                Open
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                            <div className="flex justify-end">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{doc.title || 'Untitled'}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                  <div className="flex gap-3 justify-end">
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(doc.id)}
                                      disabled={deletingId === doc.id}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {deletingId === doc.id && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                      Delete
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile list */}
                  <div className="lg:hidden divide-y divide-border/40">
                    {documents.map((doc) => {
                      const { bg, text, badge, icon: KindIcon } = getKindStyles(doc.kind);
                      return (
                        <Link
                          key={doc.id}
                          href={`/app/documents/${doc.id}`}
                          className="group flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
                        >
                          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
                            <KindIcon className={cn('h-4 w-4', text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <p className="font-semibold text-sm truncate">{doc.title || 'Untitled'}</p>
                              <Badge variant="outline" className={cn('text-[10px]', badge)}>
                                {getKindLabel(doc.kind)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
