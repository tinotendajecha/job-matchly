'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Download,
  ChevronDown,
  Palette,
  ChevronLeft,
  FileText,
  FileType2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MarkdownPreview, splitChanges } from '@/app/app/upload-tailor/helpers/utils';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { TAILOR_TEMPLATES } from '@/app/app/upload-tailor/helpers/templates';
import { useTailorStore } from '@/lib/zustand/store';
import { downloadDocument } from '@/app/app/upload-tailor/helpers/api';

interface DocumentDetail {
  id: string;
  title: string;
  kind: 'TAILORED_RESUME' | 'CREATED_RESUME' | 'COVER_LETTER' | string;
  markdown: string;
  createdAt: string;
  updatedAt: string;
  sourceMeta?: any;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string | undefined);

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadFmt, setDownloadFmt] = useState<'pdf' | 'docx'>('pdf');
  const [downloading, setDownloading] = useState(false);

  const selectedTemplateId = useTailorStore((state) => state.selectedTemplateId);
  const setSelectedTemplateId = useTailorStore((state) => state.setSelectedTemplateId);

  const isDocxDisabledForTemplate = selectedTemplateId === 'twoColumn';

  useEffect(() => {
    if (!id) return;

    async function fetchDoc() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/documents/${id}`);
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load document');
        setDocument(json.document);
      } catch (err: any) {
        setError(err?.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    }

    fetchDoc();
  }, [id]);

  const kindLabel = useMemo(() => {
    switch (document?.kind) {
      case 'TAILORED_RESUME':
        return 'Tailored Resume';
      case 'CREATED_RESUME':
        return 'Created Resume';
      case 'COVER_LETTER':
        return 'Cover Letter';
      default:
        return 'Document';
    }
  }, [document?.kind]);

  const previewMarkdown = useMemo(() => {
    const md = document?.markdown || '';
    return splitChanges(md).body || md;
  }, [document?.markdown]);

  const handleDownload = async () => {
    if (!document?.markdown) {
      toast.error('No content to download');
      return;
    }

    try {
      await downloadDocument(
        document.markdown,
        downloadFmt,
        document.title || 'Document',
        selectedTemplateId,
        setDownloading
      );
      toast.success(`${downloadFmt.toUpperCase()} downloaded 📥`);
    } catch (err: any) {
      console.error(err);
      toast.error('Download failed');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link href="/app/documents">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {document?.title || 'Document'}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{kindLabel}</Badge>
              {document?.createdAt && (
                <span>
                  Created {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-stretch gap-2">
            {/* Template Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Palette className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Template</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Choose template</DialogTitle>
                  <DialogDescription>
                    Pick how your document should look in the preview.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 grid gap-3 sm:grid-cols-1">
                  {Object.values(TAILOR_TEMPLATES).map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={[
                        'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                        selectedTemplateId === tpl.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:bg-muted/60',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{tpl.label}</span>
                        {selectedTemplateId === tpl.id && (
                          <Badge variant="default" className="text-[10px]">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Download Buttons */}
            <div className="inline-flex items-stretch">
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={!document?.markdown || downloading}
                className="rounded-r-none relative pr-10"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <Download className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Download</span>
                <span className="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-foreground">
                  {downloadFmt.toUpperCase()}
                </span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="-ml-px rounded-l-none px-2"
                    disabled={!document?.markdown || downloading}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => {
                      if (isDocxDisabledForTemplate) {
                        toast.info('DOCX is not supported for this template.');
                        return;
                      }
                      setDownloadFmt('docx');
                    }}
                    disabled={isDocxDisabledForTemplate}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>DOCX</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDownloadFmt('pdf')} className="flex items-center gap-2">
                    <FileType2 className="h-4 w-4" />
                    <span>PDF</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading document...
          </div>
        ) : error ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              {error}
            </CardContent>
          </Card>
        ) : !document ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Document not found.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MarkdownPreview value={previewMarkdown} templateId="classic" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
