'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Sparkles,
  LayoutDashboard,
  ChevronRight,
  Trash2,
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
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

const docNavLinks = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Create Resume', href: '/app/builder/modern', icon: Plus },
  { label: 'Upload & Tailor', href: '/app/upload-tailor', icon: Upload },
  { label: 'My Documents', href: '/app/documents', icon: FileText },
  { label: 'Add Credits', href: '/app/billing', icon: Sparkles },
  { label: 'Roadmap', href: '/app/coming-soon', icon: Sparkles },
];

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
      case 'TAILORED_RESUME':
        return 'Tailored Resume';
      case 'CREATED_RESUME':
        return 'Created Resume';
      case 'COVER_LETTER':
        return 'Cover Letter';
      default:
        return 'Document';
    }
  };

  const getKindStyles = (kind: string) => {
    switch (kind) {
      case 'TAILORED_RESUME':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/40',
          text: 'text-blue-600 dark:text-blue-300',
          icon: FileText,
        };
      case 'CREATED_RESUME':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/40',
          text: 'text-emerald-600 dark:text-emerald-300',
          icon: FileText,
        };
      case 'COVER_LETTER':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/40',
          text: 'text-purple-600 dark:text-purple-300',
          icon: Target,
        };
      default:
        return { bg: 'bg-muted', text: 'text-muted-foreground', icon: FileText };
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

      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6">
          {/* Left Navigation (Desktop) */}
          <aside className="hidden lg:block lg:col-span-2 w-full min-w-0">
            <div className="sticky top-24 space-y-4">
              <Card className="w-full">
                <CardHeader className="pb-3 p-4">
                  <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
                    Navigation
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <nav className="space-y-1">
                    {docNavLinks.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground hover:bg-muted/50'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-10 space-y-5 sm:space-y-6 md:space-y-8 w-full min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Your Documents
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{totalCountLabel}</p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/builder/modern">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Resume
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/app/upload-tailor">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Tailor
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/10">
              <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Keep your work organized</p>
                  <p className="text-xs text-muted-foreground">
                    View every tailored resume and cover letter in one place.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Built for fast access
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Browse Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by title..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-input border-input"
                    />
                  </div>
                  <Select value={filterType} onValueChange={(val) => setFilterType(val as any)}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-input border-input">
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

                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading documents...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No documents found yet.</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop: table view */}
                    <div className="hidden lg:block">
                      <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-left">
                          <thead className="bg-muted/50 text-sm text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3 w-[56px]"> </th>
                              <th className="px-4 py-3">Document</th>
                              <th className="px-4 py-3 w-[180px]">Type</th>
                              <th className="px-4 py-3 w-[160px]">Created</th>
                              <th className="px-4 py-3 w-[140px]"> </th>
                              <th className="px-4 py-3 w-[80px]"> </th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map((doc) => {
                              const { bg, text, icon: KindIcon } = getKindStyles(doc.kind);
                              return (
                                <tr key={doc.id} className="border-t hover:bg-muted/40 transition-colors">
                                  <td className="px-4 py-4 align-top">
                                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', bg)}>
                                      <KindIcon className={cn('h-5 w-5', text)} />
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 align-top">
                                    <div className="font-semibold truncate max-w-[48ch]">{doc.title || 'Untitled'}</div>
                                  </td>
                                  <td className="px-4 py-4 align-top">
                                    <Badge variant="secondary" className="text-[12px]">
                                      {getKindLabel(doc.kind)}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                                  </td>
                                  <td className="px-4 py-4 align-top">
                                    <Link href={`/app/documents/${doc.id}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                                      Open
                                      <ChevronRight className="h-4 w-4" />
                                    </Link>
                                  </td>
                                  <td className="px-4 py-4 align-top">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="h-4 w-4" />
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
                                            {deletingId === doc.id ? (
                                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : null}
                                            Delete
                                          </AlertDialogAction>
                                        </div>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mobile / Tablet: stacked list */}
                    <div className="lg:hidden divide-y rounded-lg border">
                      {documents.map((doc) => {
                        const { bg, text, icon: KindIcon } = getKindStyles(doc.kind);
                        return (
                          <Link
                            key={doc.id}
                            href={`/app/documents/${doc.id}`}
                            className="group flex flex-col gap-3 p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
                          >
                            <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', bg)}>
                              <KindIcon className={cn('h-5 w-5', text)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold truncate">{doc.title || 'Untitled'}</p>
                                <Badge variant="secondary" className="text-[10px]">
                                  {getKindLabel(doc.kind)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Created {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="self-start sm:self-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Open
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
