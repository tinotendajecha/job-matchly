'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Link as LinkIcon,
  Loader2,
  Clipboard,
  ExternalLink,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

export default function UploadTailorWizardPage() {
  const router = useRouter();

  // -------------- wizard state --------------
  const [step, setStep] = useState<WizardStep>(1);
  const [resumeParsed, setResumeParsed] = useState(false);
  const [jdProvided, setJdProvided] = useState(false);
  const [tailoredReady, setTailoredReady] = useState(false);

  // -------------- core data --------------
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeJson, setResumeJson] = useState<any>(null);

  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'upload' | 'url'>('text');

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [atsScore, setAtsScore] = useState(0);

  const [tailoredMarkdown, setTailoredMarkdown] = useState('');
  const [downloading, setDownloading] = useState(false);

  // pipeline indicators
  const [steps, setSteps] = useState<Record<'parse' | 'normalize' | 'analyze' | 'tailor' | 'export', StepStatus>>({
    parse: 'idle',
    normalize: 'idle',
    analyze: 'idle',
    tailor: 'idle',
    export: 'idle',
  });

  // refs
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const jdFileInputRef = useRef<HTMLInputElement | null>(null);

  // ------------------- API helpers -------------------
  async function apiParseResume(file: File) {
    toast.success('Uploading your resume 🙃')
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/parse-resume', { method: 'POST', body: fd });

    // credit gate is enforced server-side; 402 -> pricing
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

  async function apiNormalizeJDFromFile(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/normalize-jd', { method: 'POST', body: fd });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to read JD file');
    return res.json();
  }

  async function apiNormalizeJDFromUrl(url: string) {
    const res = await fetch('/api/normalize-jd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch JD URL');
    return res.json();
  }

  async function apiAnalyze(resumeText: string, jdText: string) {
    toast.success('We are analyzing your resume 🙃')
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

  async function apiExportDocx(markdown: string) {
    const res = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown }),
    });
    if (!res.ok) throw new Error('Export failed');
    return res.blob();
  }

  // ------------------- helpers -------------------
  const setStepStatus = (k: keyof typeof steps, v: StepStatus) =>
    setSteps(prev => ({ ...prev, [k]: v }));

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
          p:  (props) => <p className="text-sm md:text-base leading-6 text-foreground/90" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 space-y-1.5" {...props} />,
          li: (props) => <li className="text-sm md:text-base leading-6" {...props} />,
          a:  (props) => (
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

  // ------------------- Handlers -------------------
  const onResumeClick = () => resumeInputRef.current?.click();

  const onResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStepStatus('parse', 'loading');
      const data = await apiParseResume(file);
      setResumeFileName(file.name);
      setResumeText(data.resumeText || '');
      setResumeJson(data.resumeJson || null);
      setResumeParsed(true);
      setTailoredReady(false);
      setStepStatus('parse', 'done');
      toast.success('Resume parsed successfully! ✅');
      // move forward automatically
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setStepStatus('parse', 'error');
      toast.error(err.message || 'Could not parse resume.');
    }
  };

  const onJDFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStepStatus('normalize', 'loading');
      const { jdText } = await apiNormalizeJDFromFile(file);
      setJobDescription(jdText || '');
      setActiveTab('text');
      setStepStatus('normalize', 'done');
      setJdProvided(true);
      toast.success('Job description loaded! 📥');
    } catch (err: any) {
      console.error(err);
      setStepStatus('normalize', 'error');
      toast.error(err.message || 'Could not read JD file.');
    }
  };

  const importFromUrl = async () => {
    if (!jobUrl.trim()) return toast.error('Enter a URL first');
    try {
      setStepStatus('normalize', 'loading');
      const { jdText } = await apiNormalizeJDFromUrl(jobUrl.trim());
      setJobDescription(jdText || '');
      setActiveTab('text');
      setStepStatus('normalize', 'done');
      setJdProvided(true);
      toast.success('Imported job description from URL 🌐');
    } catch (err: any) {
      console.error(err);
      setStepStatus('normalize', 'error');
      toast.error(err.message || 'URL import failed.');
    }
  };

  const cleanAndFlagJD = async () => {
    if (!jobDescription.trim()) {
      toast.error('Paste or import a job description first');
      return;
    }
    try {
      setStepStatus('normalize', 'loading');
      const { jdText } = await apiNormalizeJDFromText(jobDescription);
      setJobDescription(jdText || jobDescription);
      setStepStatus('normalize', 'done');
      setJdProvided(true);
      toast.success('JD normalized 🧼');
    } catch (e: any) {
      setStepStatus('normalize', 'error');
      toast.error(e.message || 'Normalize failed');
    }
  };

  const runTailoring = async () => {
    if (!resumeParsed || !jobDescription.trim()) {
      toast.error('Complete steps 1 and 2 first');
      return;
    }
    try {
      // analyze
      setStepStatus('analyze', 'loading');
      const analysisRes = await apiAnalyze(resumeText, jobDescription);
      setAnalysis(analysisRes);
      setStepStatus('analyze', 'done');

      // lil’ score animation
      const targetScore = Math.max(0, Math.min(100, analysisRes.llmFitScore ?? 75));
      let s = 0;
      const tick = setInterval(() => {
        s = Math.min(targetScore, s + 2);
        setAtsScore(s);
        if (s >= targetScore) clearInterval(tick);
      }, 22);

      // tailor
      setStepStatus('tailor', 'loading');
      const tailored = await apiTailor({ resumeJson, resumeText, jdText: jobDescription });
      setTailoredMarkdown(tailored.tailoredMarkdown || '');
      setTailoredReady(true);
      setStepStatus('tailor', 'done');
      toast.success('Tailored and ready! ✨');
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setStepStatus('tailor', 'error');
      toast.error(err.message || 'Tailoring failed. Try again.');
    }
  };

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

  const copyMarkdown = async () => {
    if (!previewMarkdown) return;
    await navigator.clipboard.writeText(previewMarkdown);
    toast.success('Markdown copied 📋');
  };

  // keyword rows
  const keywordRows = (() => {
    if (!analysis) return [];
    const matched = analysis.matchedKeywords.map(w => ({ word: w, matched: true, frequency: 1 }));
    const missing = analysis.missingKeywords.map(w => ({ word: w, matched: false, frequency: 0 }));
    return [...matched, ...missing].slice(0, 12);
  })();

  // ------------------- UI bits -------------------
  const StepPill = ({ label, status }: { label: string; status: StepStatus }) => {
    const icon =
      status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
      status === 'done'    ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> :
      status === 'error'   ? <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" /> :
                             <div className="h-3.5 w-3.5 rounded-full bg-muted" />;
    const tone =
      status === 'done'    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
      status === 'loading' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
      status === 'error'   ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' :
                             'bg-muted text-muted-foreground';
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${tone}`}>
        {icon}{label}
      </span>
    );
  };

  const WizardStepper = () => {
    // const items = [
    //   { id: 1, label: 'Upload Resume 📄', done: resumeParsed },
    //   { id: 2, label: 'Job Description 🎯', done: jdProvided },
    //   { id: 3, label: 'Tailor & Preview ✨', done: tailoredReady },
    // ] as const;

    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <StepPill label="Parsing"   status={steps.parse} />
              <StepPill label="Normalizing" status={steps.normalize} />
              <StepPill label="Analyzing" status={steps.analyze} />
              <StepPill label="Tailoring" status={steps.tailor} />
              <StepPill label="Exporting" status={steps.export} />
            </div>
            
          </div>
        </CardContent>
      </Card>
    );
  };

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

        {/* Top: stepper + pipeline badges */}
        <WizardStepper />

        {/* STEP 1 — Upload Resume */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-7" />
                  Upload your resume 📄
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  We currently support <strong>DOCX</strong> and <strong>TXT</strong> (PDF coming soon).
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {!resumeParsed ? (
                  <motion.div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    whileHover={{ scale: 1.01 }}
                    onClick={onResumeClick}
                  >
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Drop your resume here or click to choose</h3>
                    <p className="text-sm text-muted-foreground mb-4">We’ll parse it and prep it for tailoring.</p>
                    <Button variant="outline">Choose File</Button>
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".docx,.txt"
                      className="hidden"
                      onChange={onResumeFileChange}
                    />
                  </motion.div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 rounded-lg bg-green-50 dark:bg-green-950/20 p-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full grid place-items-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{resumeFileName}</p>
                      <p className="text-xs text-muted-foreground">Parsed successfully</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onResumeClick}>
                      Replace
                    </Button>
                  </div>
                )}

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" disabled>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                  className=''
                    onClick={() => {
                      if (!resumeParsed) {
                        toast.info('Upload your resume first');
                        return;
                      }
                      setStep(2);
                    }}
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
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Add the Job Description 🎯
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Paste, upload or import from a URL — we’ll clean it up for best results.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text">Paste Text</TabsTrigger>
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                    <TabsTrigger value="url">URL</TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4 pt-4">
                    <Textarea
                      placeholder="Paste the job description here…"
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value);
                        setJdProvided(!!e.target.value.trim());
                      }}
                      rows={8}
                      className="resize-none"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                      <span>{jobDescription.length} characters</span>
                      <div className="flex gap-2">
                        <Button
                          onClick={cleanAndFlagJD}
                          variant="secondary"
                          size="sm"
                          disabled={!jobDescription.trim()}
                        >
                          <Loader2 className="h-4 w-4 mr-2" />
                          Clean & Normalize
                        </Button>
                        <Button
                          onClick={() => setStep(1)}
                          variant="ghost"
                          size="sm"
                        >
                          Back to Resume
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4 pt-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Upload job posting (DOCX or TXT)</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => jdFileInputRef.current?.click()}
                      >
                        Choose File
                      </Button>
                      <input
                        ref={jdFileInputRef}
                        type="file"
                        accept=".docx,.txt"
                        className="hidden"
                        onChange={onJDFileChange}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobUrl">Job Posting URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="jobUrl"
                          placeholder="https://company.com/careers/job-id"
                          className="flex-1"
                          value={jobUrl}
                          onChange={(e) => setJobUrl(e.target.value)}
                        />
                        <Button variant="outline" onClick={importFromUrl} disabled={!jobUrl}>
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={runTailoring}
                    disabled={!resumeParsed || !jdProvided}
                  >
                    Tailor my resume
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 3 — Tailor & Preview */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mt-6 overflow-hidden">
              {/* sticky toolbar */}
      <div className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5">
          {/* Left: title */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Tailored Resume Preview</span>
            {steps.tailor === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Right: actions — scrollable on mobile */}
          <div
             className="flex w-full gap-2 overflow-x-auto pb-1 no-scrollbar sm:w-auto sm:overflow-visible"
            // prevent children from shrinking out of view
          >
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

            <Button
              size="sm"
              onClick={handleExportDocx}
              disabled={!tailoredMarkdown || downloading}
              className="shrink-0"
              aria-label="Download DOCX"
              title="Download DOCX"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
              ) : (
                <Download className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Download DOCX</span>
            </Button>
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

            {/* Changes Summary (not exported) */}
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
                      p:  (p) => <p className="text-sm leading-6" {...p} />,
                    }}
                  >
                    {changesMarkdown}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            )}

            {/* Optional info accordion-ish cards */}
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
                              {k.matched ? `${k.frequency}x` : 'Missing'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button variant="ghost" onClick={() => { setStep(1); setTailoredReady(false); }}>
                Start Over
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
