'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  Target,
  Download,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Clipboard,
  ExternalLink,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lightbulb,
  CheckCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, FileType2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import Tesseract from 'tesseract.js';

import { useTailorStore } from '@/lib/zustand/store';


type Analysis = {
  ok: boolean;
  keywordOverlapScore: number;
  llmFitScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  notes: string[];
};

type StepStatus = 'idle' | 'loading' | 'done' | 'error';
type WizardStep = 1 | 2 | 3;


// ------------------ API helpers ------------------
async function apiExportPdf(markdown: string) {
  const res = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown }),
  });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}



async function apiParseResume(file: File, router: ReturnType<typeof useRouter>) {
  toast.success('Uploading your resume 🙃');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/parse-resume', { method: 'POST', body: fd });

  if (res.status === 402) {
    router.push('/pricing');
    throw new Error('You are out of credits.');
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to parse resume');
    return data;
  } else {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Failed to parse resume');
  }
}

async function apiNormalizeJDFromText(text: string) {
  const res = await fetch('/api/normalize-jd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to normalize JD');
  return res.json();
}

async function apiAnalyze(resumeText: string, jdText: string) {
  toast.success('We are analyzing your resume 🙃');
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jdText }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Analyze failed');
  return res.json() as Promise<Analysis>;
}

async function apiTailor(payload: { resumeJson: any; resumeText: string; jdText: string }) {
  const res = await fetch('/api/tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Tailor failed');
  return res.json() as Promise<{ ok: boolean; tailoredMarkdown: string }>;
}

// ------------------- Component -------------------
export default function UploadTailorWizardPage() {
  const router = useRouter();

  // pull everything we need from the store
  const {
    step, setStep,
    resumeParsed, setResumeParsed,
    resumeFileName, setResumeFileName,
    resumeText, setResumeText,
    resumeJson, setResumeJson,
    jobDescription, setJobDescription,
    jdProvided, setJdProvided,
    activeTab, setActiveTab,
    imageOCRDone, setImageOCRDone,
    jdImageName, setJdImageName,
    analysis, setAnalysis,
    atsScore, setAtsScore,
    tailoredMarkdown, setTailoredMarkdown,
    steps, setStepStatus,
    downloadFmt, setDownloadFmt,
    resetOCR, resetAll,
  } = useTailorStore();

  // transient (not persisted)
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLang] = useState<'eng'>('eng');

  const [tailoredReady, setTailoredReady] = useState(false)

  // refs
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  // export helpers
  const handleExportPdf = async () => {
    if (!tailoredMarkdown) return toast.error('Generate the tailored resume first');
    try {
      setStepStatus('export', 'loading');
      setDownloadingPdf(true);
      const blob = await apiExportPdf(tailoredMarkdown);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setStepStatus('export', 'done');
      toast.success('PDF downloaded 📥');
    } catch (err: any) {
      console.error(err);
      setStepStatus('export', 'error');
      toast.error('Download failed.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  async function apiExportDocx(markdown: string) {
    const res = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown }),
    });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  }

  const handleExportDocx = async () => {
    if (!tailoredMarkdown) return toast.error('Generate the tailored resume first');
    try {
      setStepStatus('export', 'loading');
      setDownloading(true);
      const blob = await apiExportDocx(tailoredMarkdown);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.docx';
      a.click();
      URL.revokeObjectURL(url);
      setStepStatus('export', 'done');
      toast.success('DOCX downloaded 📥');
    } catch (err: any) {
      console.error(err);
      setStepStatus('export', 'error');
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

  // markdown helpers
  function splitChanges(md: string) {
    if (!md) return { body: '', changes: '' };
    const m = md.match(/^##\s*Changes\s+Summary\s*$/mi);
    if (!m) return { body: md, changes: '' };
    const [pre, ...rest] = md.split(/^##\s*Changes\s+Summary\s*$/mi);
    return { body: pre.trim(), changes: rest.join('\n').trim() };
  }
  const { body: previewMarkdown, changes: changesMarkdown } = splitChanges(tailoredMarkdown);

  function flatten(children: any): string {
    if (Array.isArray(children)) return children.map(flatten).join('');
    if (typeof children === 'string' || typeof children === 'number') return String(children);
    if (children && typeof children === 'object' && 'props' in children) {
      return flatten((children as any).props?.children);
    }
    return '';
  }

  const MarkdownPreview = ({ value }: { value: string }) => (
    <div className="px-4 py-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-1 text-[#0f2a43]" {...props} />
          ),
          h2: (props) => {
            const txt = flatten(props.children).trim().toLowerCase();
            const isExperience = txt === 'experience';
            return (
              <h2
                className={[
                  'font-semibold border-b pb-1 mt-6 mb-3',
                  isExperience
                    ? 'text-[20px] md:text-[22px] text-[#0e6ba8]'
                    : 'text-[19px] md:text-[20px] text-[#12467F]',
                ].join(' ')}
                {...props}
              />
            );
          },
          p: (props) => <p className="text-sm md:text-base leading-6 text-foreground/90" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 space-y-1.5" {...props} />,
          li: (props) => <li className="text-sm md:text-base leading-6" {...props} />,
          a: (props) => (
            <a className="text-[#1155cc] underline underline-offset-2 hover:no-underline" target="_blank" rel="noreferrer" {...props} />
          ),
          hr: (props) => <hr className="my-6 border-muted" {...props} />,
          strong: (props) => <strong className="font-semibold text-[#0e6ba8]" {...props} />,
          em: (props) => <em className="italic" {...props} />,
          code: (props: any) =>
            props.inline ? (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs" {...props} />
            ) : (
              <pre>
                <code className="block rounded bg-muted px-3 py-2 text-xs" {...props} />
              </pre>
            ),
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );

  // handlers
  const onResumeClick = () => resumeInputRef.current?.click();

  const triggerResumePicker = () => {
    const el = resumeInputRef.current;
    if (!el) return;
    // allow re-selecting the same file
    el.value = '';
    el.click();
  };

  const onResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStepStatus('parse', 'loading');
      const data = await apiParseResume(file, router);
      setResumeFileName(file.name);
      setResumeText(data.resumeText || '');
      setResumeJson(data.resumeJson || null);
      setResumeParsed(true);
      setTailoredReady(false);
      setStepStatus('parse', 'done');
      toast.success('Resume parsed successfully! ✅');
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setStepStatus('parse', 'error');
      toast.error(err.message || 'Could not parse resume.');
    }
  };

  // OCR (client)
  async function ocrImageInBrowser(file: File) {
    setActiveTab('image');
    setOcrBusy(true);
    setOcrProgress(0);
    try {
      const { data } = await Tesseract.recognize(file, ocrLang, {
        logger: (m) => {
          if (m.status === 'recognizing text' && typeof m.progress === 'number') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });
      const raw = (data?.text || '').trim();
      if (!raw) throw new Error('No text detected in the image');

      // (Optional) keep this normalization here; runTailoring also normalizes (idempotent)
      const { jdText } = await apiNormalizeJDFromText(raw);
      setJobDescription(jdText || raw);
      setJdProvided(true);
      setImageOCRDone(true);
      setJdImageName(file.name);
      toast.success('Extracted text from image 🪄');

      setActiveTab('text'); // go back to text with filled JD
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'OCR failed. Try a clearer image.');
    } finally {
      setOcrBusy(false);
      setOcrProgress(0);
    }
  }

  // abstracted flow: normalize happens inside tailor
  const runTailoring = async () => {
    if (!resumeParsed || !jobDescription.trim()) {
      toast.error('Complete steps 1 and 2 first');
      return;
    }
    try {
      // 1) normalize JD automatically
      setStepStatus('normalize', 'loading');
      const { jdText } = await apiNormalizeJDFromText(jobDescription);
      const finalJD = jdText || jobDescription;
      setJobDescription(finalJD);
      setStepStatus('normalize', 'done');
      setJdProvided(true);

      // 2) analyze
      setStepStatus('analyze', 'loading');
      const analysisRes = await apiAnalyze(resumeText, finalJD);
      setAnalysis(analysisRes);
      setStepStatus('analyze', 'done');

      // score animation
      const targetScore = Math.max(0, Math.min(100, analysisRes.llmFitScore ?? 75));
      let s = 0;
      const timer = setInterval(() => {
        s = Math.min(targetScore, s + 2);
        setAtsScore(s);
        if (s >= targetScore) clearInterval(timer);
      }, 22);

      // 3) tailor
      setStepStatus('tailor', 'loading');
      const tailored = await apiTailor({ resumeJson, resumeText, jdText: finalJD });
      setTailoredMarkdown(tailored.tailoredMarkdown || '');
      setStepStatus('tailor', 'done');
      toast.success('Tailored and ready! ✨');
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setStepStatus('tailor', 'error');
      toast.error(err.message || 'Tailoring failed. Try again.');
    }
  };

  const copyMarkdown = async () => {
    if (!previewMarkdown) return;
    await navigator.clipboard.writeText(previewMarkdown);
    toast.success('Markdown copied 📋');
  };

  // ui helpers
  const jdBusy =
    steps.normalize === 'loading' ||
    steps.analyze === 'loading' ||
    steps.tailor === 'loading';

  const jdLabel =
    steps.analyze === 'loading'
      ? 'Analyzing your resume & JD…'
      : steps.tailor === 'loading'
        ? 'Tailoring your resume…'
        : 'Cleaning JD…';

  const tailoringBusy =
    steps.analyze === 'loading' || steps.tailor === 'loading' || steps.export === 'loading';

  const isDownloading = downloading || downloadingPdf;

  const StepPill = ({ label, status }: { label: string; status: StepStatus }) => {
    const icon =
      status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
        status === 'done' ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> :
          status === 'error' ? <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" /> :
            <div className="h-3.5 w-3.5 rounded-full bg-muted" />;
    const tone =
      status === 'done' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
        status === 'loading' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
          status === 'error' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
            'bg-muted text-muted-foreground';
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${tone}`}>
        {icon}{label}
      </span>
    );
  };

  const WizardStepper = () => (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <StepPill label="Parsing" status={steps.parse} />
            <StepPill label="Normalizing" status={steps.normalize} />
            <StepPill label="Analyzing" status={steps.analyze} />
            <StepPill label="Tailoring" status={steps.tailor} />
            <StepPill label="Exporting" status={steps.export} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  function LoadingOverlay({ show, label }: { show: boolean; label?: string }) {
    if (!show) return null;
    return (
      <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-background/70 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{label || "Working…"}</span>
        </div>
      </div>
    );
  }

  // keyword rows
  const keywordRows = (() => {
    if (!analysis) return [];
    const matched = analysis.matchedKeywords.map(w => ({ word: w, matched: true, frequency: 1 }));
    const missing = analysis.missingKeywords.map(w => ({ word: w, matched: false, frequency: 0 }));
    return [...matched, ...missing].slice(0, 12);
  })();

  // ------------------- Render -------------------
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-4 py-6 md:py-8 max-w-6xl">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Tailor your resume in 3 easy steps <Sparkles className="inline h-6 w-6 text-primary ml-1" />
          </h1>
        </div>

        <WizardStepper />

        {/* STEP 1 — Upload Resume */}
        {/* STEP 1 — Upload Resume */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 whitespace-nowrap">
                  <Upload className="h-5 w-5 shrink-0" />
                  <span className='text-xl md:text-2xl'>Upload your resume 📄</span>
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  We currently support <strong>TXT</strong>, <strong>DOCX</strong> and <strong>PDF</strong>.
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Hidden input — ALWAYS MOUNTED */}
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".docx,.txt,.pdf"
                  className="sr-only"
                  onChange={onResumeFileChange}
                />

                {/* Upload area */}
                {!resumeParsed ? (
                  <div className="relative">
                    <motion.div
                      role="button"
                      tabIndex={0}
                      aria-busy={steps.parse === 'loading'}
                      aria-disabled={steps.parse === 'loading'}
                      className={[
                        "border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition",
                        steps.parse === 'loading'
                          ? "opacity-70 pointer-events-none"
                          : "cursor-pointer hover:border-primary/50 border-muted-foreground/25"
                      ].join(" ")}
                      whileHover={steps.parse === 'loading' ? {} : { scale: 1.01 }}
                      onClick={() => steps.parse !== 'loading' && triggerResumePicker()}
                      onKeyDown={(e) => {
                        if (steps.parse === 'loading') return;
                        if (e.key === 'Enter' || e.key === ' ') triggerResumePicker();
                      }}
                    >
                      <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                      <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">
                        Drop your resume here or tap to choose
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                        We’ll parse it and prep it for tailoring.
                      </p>
                      <Button variant="outline" size="sm" disabled={steps.parse === 'loading'}>
                        Choose File
                      </Button>

                      <LoadingOverlay show={steps.parse === 'loading'} label="Parsing your resume…" />
                    </motion.div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/20 p-4">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full grid place-items-center shrink-0">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{resumeFileName}</p>
                        <p className="text-xs text-muted-foreground">Parsed successfully</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={triggerResumePicker}
                        className="w-full sm:w-auto"
                      >
                        Replace
                      </Button>
                    </div>

                    <LoadingOverlay show={steps.parse === 'loading'} label="Parsing your resume…" />
                  </div>
                )}

                {/* Nav buttons — stacked on mobile with spacing */}
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button variant="outline" disabled className="w-full sm:w-auto">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => {
                      if (!resumeParsed) {
                        toast.info('Upload your resume first');
                        return;
                      }
                      setStep(2);
                    }}
                    disabled={steps.parse === 'loading'}
                  >
                    Next: Job Description
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 2 — Job Description */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 whitespace-nowrap">
                  <Target className="h-5 w-5 shrink-0" />
                  <span className="text-lg sm:text-xl font-semibold">
                    Add the job description <span className="hidden xs:inline">🎯</span>
                  </span>
                </CardTitle>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Paste the JD text, or use the Image (OCR) tab to extract from a screenshot.
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                  <TabsList className="w-full flex flex-wrap gap-2 justify-start">
                    <TabsTrigger value="text" className="px-3 py-1.5 text-xs sm:text-sm data-[state=active]:font-medium">
                      Paste Text
                    </TabsTrigger>
                    <TabsTrigger value="image" className="px-3 py-1.5 text-xs sm:text-sm">
                      Image (OCR)
                    </TabsTrigger>
                    <TabsTrigger value="upload" disabled className="px-3 py-1.5 text-xs sm:text-sm opacity-60 cursor-not-allowed" title="Coming soon">
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="url" disabled className="px-3 py-1.5 text-xs sm:text-sm opacity-60 cursor-not-allowed" title="Coming soon">
                      URL
                    </TabsTrigger>
                  </TabsList>

                  {/* TEXT TAB */}
                  <TabsContent value="text" className="space-y-4 pt-4">
                    <div className="rounded-lg border bg-muted/50 p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="mt-0.5 shrink-0">
                          <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="text-xs sm:text-sm">
                          <p className="font-medium">Tip</p>
                          <p className="text-muted-foreground">
                            If your JD is an <strong>image</strong> or <strong>PDF</strong>, try the Image (OCR) tab to auto-extract.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <Textarea
                        placeholder="Paste the job description here…"
                        value={jobDescription}
                        onChange={(e) => {
                          if (jdBusy) return;
                          setJobDescription(e.target.value);
                          setJdProvided(!!e.target.value.trim());
                        }}
                        rows={8}
                        className="resize-none min-h-40 text-sm sm:text-base"
                        aria-busy={jdBusy}
                        disabled={jdBusy}
                      />
                      {/* Normalization now auto-runs inside Tailor; overlay shows progress for the whole pipeline */}
                      <LoadingOverlay show={jdBusy} label={jdLabel} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{jobDescription.length} characters</span>
                      <Button
                        onClick={() => setStep(1)}
                        variant="ghost"
                        size="sm"
                        className="w-auto"
                        disabled={jdBusy}
                      >
                        Back to Resume
                      </Button>
                    </div>
                  </TabsContent>

                  {/* IMAGE OCR TAB */}
                  <TabsContent value="image" className="space-y-4 pt-4">
                    {!imageOCRDone ? (
                      <div className="border-2 border-dashed rounded-lg p-6 text-center relative">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) ocrImageInBrowser(f);
                          }}
                          className="hidden"
                          id="jd-image"
                        />
                        <label htmlFor="jd-image" className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded border">
                          <Upload className="h-4 w-4" />
                          Choose an image
                        </label>

                        {ocrBusy && (
                          <div className="mt-4 text-sm flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Recognizing text… {ocrProgress}%
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          Tip: Clear screenshots with good contrast work best.
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/20 p-4">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full grid place-items-center shrink-0">
                            <CheckCheck className="h-5 w-5 text-green-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{jdImageName || 'Image'}</p>
                            <p className="text-xs text-muted-foreground">Text extraction successful</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab('text')}
                              className="w-full sm:w-auto"
                            >
                              View Text
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={resetOCR}
                              className="w-full sm:w-auto"
                            >
                              Restart extraction
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* PLACEHOLDERS */}
                  <TabsContent value="upload" className="pt-4">
                    <div className="rounded-lg border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                      Upload from file is coming soon.
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="pt-4">
                    <div className="rounded-lg border bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                      Import from URL is coming soon.
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Nav buttons */}
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto"
                    disabled={jdBusy || tailoringBusy}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    onClick={runTailoring}
                    disabled={!resumeParsed || !jdProvided || steps.normalize === 'loading' || tailoringBusy}
                    aria-disabled={!resumeParsed || !jdProvided || steps.normalize === 'loading' || tailoringBusy}
                    data-busy={tailoringBusy ? 'true' : 'false'}
                    className={`w-full sm:w-auto ${tailoringBusy ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    {tailoringBusy ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Tailoring your resume…
                      </>
                    ) : (
                      <>
                        Tailor my resume
                        <Sparkles className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 3 — Tailor & Preview */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button variant="ghost" onClick={() => { resetAll(); }}>
                Start Over
              </Button>
            </div>
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
                      onClick={() => setStep(2)}
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
                        if (!previewMarkdown) return;
                        await navigator.clipboard.writeText(previewMarkdown);
                        toast.success('Markdown copied 📋');
                      }}
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
                          <DropdownMenuItem onClick={() => setDownloadFmt('docx')} className="flex items-center gap-2">
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

                {(() => {
                  const rows = (() => {
                    if (!analysis) return [];
                    const matched = analysis.matchedKeywords.map(w => ({ word: w, matched: true, frequency: 1 }));
                    const missing = analysis.missingKeywords.map(w => ({ word: w, matched: false, frequency: 0 }));
                    return [...matched, ...missing].slice(0, 12);
                  })();
                  if (!rows.length) return null;
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Keyword Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {rows.map((k, idx) => (
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
                  );
                })()}
              </div>
            )}


          </motion.div>
        )}
      </div>
    </div>
  );
}

