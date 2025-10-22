import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Clipboard,
  FileEdit,
  ExternalLink,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Target,
  Loader2,
  FileText,
  FileType2
} from 'lucide-react';
import { MarkdownPreview, splitChanges } from '../helpers/utils';
import { apiExportPdf, apiExportDocx, handleExportDocxForCoverLetter } from '../helpers/api';
import type { Analysis, StepStatus } from '../types';

interface StepThreeProps {
  tailoredMarkdown: string;
  generatedCoverLetter: string;
  analysis: Analysis | null;
  atsScore: number;
  downloadFmt: string;
  steps: {
    tailor: StepStatus;
    export: StepStatus;
  };
  onStepChange: (step: number) => void;
  onResetAll: () => void;
  onDownloadFmtChange: (fmt: string) => void;
  onGenerateCoverLetter: () => void;
  coverLoading: boolean;
  coverTitle: string;
  coverMarkdown: string;
}

export const StepThree = ({
  tailoredMarkdown,
  generatedCoverLetter,
  analysis,
  atsScore,
  downloadFmt,
  steps,
  onStepChange,
  onResetAll,
  onDownloadFmtChange,
  onGenerateCoverLetter,
  coverLoading,
  coverTitle,
  coverMarkdown
}: StepThreeProps) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const { body: previewMarkdown, changes: changesMarkdown } = splitChanges(tailoredMarkdown);

  const handleExportPdf = async () => {
    if (!tailoredMarkdown) return toast.error('Generate the tailored resume first');
    try {
      setDownloadingPdf(true);
      const blob = await apiExportPdf(tailoredMarkdown);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded 📥');
    } catch (err: any) {
      console.error(err);
      toast.error('Download failed.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    if (!tailoredMarkdown) return toast.error('Generate the tailored resume first');
    try {
      setDownloading(true);
      const blob = await apiExportDocx(tailoredMarkdown);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.docx';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('DOCX downloaded 📥');
    } catch (err: any) {
      console.error(err);
      toast.error('Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  async function handlePrimaryDownload() {
    if (!tailoredMarkdown) return toast.error('Generate the tailored resume first');
    if (downloadFmt === 'docx') {
      await handleExportDocx();
    } else {
      await handleExportPdf();
    }
  }

  const copyMarkdown = async () => {
    if (!previewMarkdown) return;
    await navigator.clipboard.writeText(previewMarkdown);
    toast.success('Markdown copied 📋');
  };

  const isDownloading = downloading || downloadingPdf;

  // keyword rows
  const keywordRows = (() => {
    if (!analysis) return [];
    const matched = analysis.matchedKeywords.map(w => ({ word: w, matched: true, frequency: 1 }));
    const missing = analysis.missingKeywords.map(w => ({ word: w, matched: false, frequency: 0 }));
    return [...matched, ...missing].slice(0, 12);
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={() => onStepChange(2)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button variant="ghost" onClick={() => { onResetAll(); }}>
          Start Over
        </Button>
      </div>

      {/* --- TABS: Resume / Cover Letter --- */}
      <Tabs defaultValue="resume" className="mt-6">
        <TabsList className="flex gap-2 w-full justify-start ">
          <TabsTrigger value="resume">Tailored Resume</TabsTrigger>
          <TabsTrigger value="cover">Cover Letter</TabsTrigger>
        </TabsList>

        {/* ---------------- Resume Tab ---------------- */}
        <TabsContent value="resume">
          <Card className="mt-6 overflow-hidden">
            <div className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Tailored Resume Preview</span>
                  {steps.tailor === "loading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                <div className="flex w-full gap-2 overflow-x-auto pb-1 no-scrollbar sm:w-auto sm:overflow-visible">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStepChange(2)}
                    className="shrink-0"
                    aria-label="Back to Job Description"
                    title="Back to JD"
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Back to JD</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyMarkdown}
                    disabled={!previewMarkdown}
                    className="shrink-0"
                    aria-label="Copy Markdown"
                    title="Copy Markdown"
                  >
                    <Clipboard className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Copy Markdown</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Editor coming soon")}
                    className="shrink-0"
                    aria-label="Open in Editor (coming soon)"
                    title="Open in Editor (coming soon)"
                  >
                    <FileEdit className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Open in Editor</span>
                  </Button>

                  {/* Split Download */}
                  <div className="inline-flex items-stretch shrink-0">
                    <Button
                      size="sm"
                      onClick={handlePrimaryDownload}
                      disabled={!tailoredMarkdown || isDownloading}
                      className="rounded-r-none relative pr-10"
                      aria-label={`Download ${downloadFmt.toUpperCase()}`}
                      title={`Download ${downloadFmt.toUpperCase()}`}
                    >
                      {isDownloading ? (
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
                          aria-label="Change download format"
                          title="Change format"
                          disabled={!tailoredMarkdown || isDownloading}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onDownloadFmtChange('docx')} className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>DOCX</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownloadFmtChange('pdf')} className="flex items-center gap-2">
                          <FileType2 className="h-4 w-4" />
                          <span>PDF</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              {!previewMarkdown ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  Your tailored resume will appear here after generation.
                </div>
              ) : (
                <MarkdownPreview value={previewMarkdown} />
              )}
            </CardContent>
          </Card>

          {/* Changes Summary */}
          {changesMarkdown && (
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Changes Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ul: (p) => <ul className="list-disc pl-5 space-y-1.5" {...p} />,
                    li: (p) => <li className="text-sm leading-6" {...p} />,
                    p: (p) => <p className="text-sm leading-6" {...p} />,
                  }}
                >
                  {changesMarkdown}
                </ReactMarkdown>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---------------- Cover Letter Tab ---------------- */}
        <TabsContent value="cover">
          <Card className="mt-6 overflow-hidden">
            <div className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Cover Letter Preview</span>
                  {steps.tailor === "loading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                <div className="flex w-full gap-2 overflow-x-auto pb-1 no-scrollbar sm:w-auto sm:overflow-visible">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStepChange(2)}
                    className="shrink-0"
                    aria-label="Back to Job Description"
                    title="Back to JD"
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Back to JD</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const textToCopy = generatedCoverLetter;
                      if (!textToCopy) toast.info('Generate Cover Letter First!');
                      await navigator.clipboard.writeText(textToCopy);
                      toast.success('Markdown copied 📋');
                    }}
                    disabled={!generatedCoverLetter}
                    className="shrink-0"
                    aria-label="Copy Markdown"
                    title="Copy Markdown"
                  >
                    <Clipboard className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Copy Markdown</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Editor coming soon")}
                    className="shrink-0"
                    aria-label="Open in Editor (coming soon)"
                    title="Open in Editor (coming soon)"
                  >
                    <FileEdit className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Open in Editor</span>
                  </Button>

                  {/* Split Download for Cover Letter */}
                  <div className="inline-flex items-stretch shrink-0">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          if (downloadFmt === 'docx') {
                            if (!generatedCoverLetter) toast.info('generate cover letter plz');
                            await handleExportDocxForCoverLetter(coverTitle || 'Cover Letter', generatedCoverLetter);
                          } else {
                            toast.info('No support for pdf cover letter yet!')
                          }
                          toast.success('Downloaded 📥');
                        } catch (e: any) {
                          console.error(e);
                          toast.error('Download failed.');
                        }
                      }}
                      disabled={(!coverMarkdown && !tailoredMarkdown) || isDownloading}
                      className="rounded-r-none relative pr-10"
                      aria-label={`Download ${downloadFmt.toUpperCase()}`}
                      title={`Download ${downloadFmt.toUpperCase()}`}
                    >
                      {isDownloading ? (
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
                          aria-label="Change download format"
                          title="Change format"
                          disabled={(!coverMarkdown && !tailoredMarkdown) || isDownloading}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onDownloadFmtChange('docx')} className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>DOCX</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownloadFmtChange('pdf')} className="flex items-center gap-2">
                          <FileType2 className="h-4 w-4" />
                          <span>PDF</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="space-y-3">
              {
                !generatedCoverLetter ? (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Create a cover letter matched to this job. <span className="font-semibold">Costs 1 credit.</span>
                  </p>
                ) : null
              }

              <div className="flex gap-2 flex-wrap justify-center">
                {!generatedCoverLetter ? (
                  <Button
                    onClick={onGenerateCoverLetter}
                    disabled={coverLoading || !tailoredMarkdown}
                    className='mt-4'
                  >
                    Generate Cover Letter
                  </Button>
                ) : null}
              </div>

              {coverLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  Generating cover letter…
                </div>
              ) : generatedCoverLetter ? (
                <pre className="whitespace-pre-wrap text-sm leading-6 border rounded p-4 bg-muted mt-3">
                  {generatedCoverLetter}
                </pre>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Your generated cover letter will appear here after you click
                  <span className="font-semibold"> Generate Cover Letter</span>.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ATS + Keywords */}
      {analysis && (
        <div className="mt-6 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                ATS Compatibility (Info)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-3xl font-bold text-green-600">{atsScore}%</div>
                <Progress value={atsScore} className="h-2.5" />
                <p className="text-sm text-muted-foreground">
                  Fit score: {analysis.llmFitScore}/100
                </p>
              </div>
              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">
                    Keyword overlap {(analysis.keywordOverlapScore * 100).toFixed(0)}%
                  </span>
                </div>
                {analysis.notes?.[0] && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{analysis.notes[0]}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Keyword analysis card */}
          {keywordRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Keyword Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {keywordRows.map((k, idx) => (
                    <div
                      key={`${k.word}-${idx}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {k.matched ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium">{k.word}</span>
                      </div>
                      <Badge variant={k.matched ? 'default' : 'secondary'}>
                        {k.matched ? `1x` : 'Missing'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  );
};
