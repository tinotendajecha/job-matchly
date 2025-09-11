'use client';

import { useRef, useState } from 'react';
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
  Zap,
  Link as LinkIcon,
  Loader2,
  Clipboard,
  ExternalLink,
  FileEdit,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
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

export default function UploadTailorPage() {
  // -------- Source-of-truth state --------
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [resumeJson, setResumeJson] = useState<any>(null);

  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [atsScore, setAtsScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'upload' | 'url'>('text');

  const [tailoredMarkdown, setTailoredMarkdown] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  // pipeline step status
  const [steps, setSteps] = useState<Record<'parse'|'normalize'|'analyze'|'tailor'|'export', StepStatus>>({
    parse: 'idle',
    normalize: 'idle',
    analyze: 'idle',
    tailor: 'idle',
    export: 'idle',
  });

  // -------- Refs for hidden inputs --------
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const jdFileInputRef = useRef<HTMLInputElement | null>(null);

  // ------------------- API helpers -------------------
  async function apiParseResume(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/parse-resume', { method: 'POST', body: fd });
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
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jdText }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Analyze failed');
    return res.json() as Promise<Analysis>;
  }

  async function apiTailor(payload: { resumeJson: any; resumeText: string; jdText: string; }) {
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
  const setStep = (k: keyof typeof steps, v: StepStatus) => setSteps(prev => ({ ...prev, [k]: v }));

  function splitChanges(md: string) {
    if (!md) return { body: '', changes: '' };
    const m = md.match(/^##\s*Changes\s+Summary\s*$/mi);
    if (!m) return { body: md, changes: '' };
    const [pre, ...rest] = md.split(/^##\s*Changes\s+Summary\s*$/mi);
    return { body: pre.trim(), changes: rest.join('\n').trim() };
  }

  const { body: previewMarkdown, changes: changesMarkdown } = splitChanges(tailoredMarkdown);

  // ------------------- UI Handlers -------------------
  const handleResumeUploadClick = () => resumeInputRef.current?.click();

  const onResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStep('parse', 'loading');
      const data = await apiParseResume(file);
      setResumeUploaded(true);
      setResumeFileName(file.name);
      setResumeText(data.resumeText || '');
      setResumeJson(data.resumeJson || null);
      setStep('parse', 'done');
      toast.success('Resume parsed successfully!');
    } catch (err: any) {
      console.error(err);
      setStep('parse', 'error');
      toast.error(err.message || 'Could not parse resume.');
    }
  };

  const onJDFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStep('normalize', 'loading');
      const { jdText } = await apiNormalizeJDFromFile(file);
      setJobDescription(jdText || '');
      setActiveTab('text');
      setStep('normalize', 'done');
      toast.success('Job description loaded!');
    } catch (err: any) {
      console.error(err);
      setStep('normalize', 'error');
      toast.error(err.message || 'Could not read JD file.');
    }
  };

  const importFromUrl = async () => {
    if (!jobUrl.trim()) return toast.error('Enter a URL first');
    try {
      setStep('normalize', 'loading');
      const { jdText } = await apiNormalizeJDFromUrl(jobUrl.trim());
      setJobDescription(jdText || '');
      setActiveTab('text');
      setStep('normalize', 'done');
      toast.success('Imported job description from URL');
    } catch (err: any) {
      console.error(err);
      setStep('normalize', 'error');
      toast.error(err.message || 'URL import failed.');
    }
  };

  const handleTailor = async () => {
    if (!resumeUploaded || !jobDescription.trim()) {
      toast.error('Please upload a resume and add a job description');
      return;
    }
    try {
      // 1) Analyze
      setStep('analyze', 'loading');
      const analysisRes = await apiAnalyze(resumeText, jobDescription);
      setAnalysis(analysisRes);
      setStep('analyze', 'done');

      // animate ATS score to LLM fit score (fallback to 75 if missing)
      const targetScore = Math.max(0, Math.min(100, analysisRes.llmFitScore ?? 75));
      setShowResults(true);
      let score = 0;
      const tick = setInterval(() => {
        score = Math.min(targetScore, score + 2);
        setAtsScore(score);
        if (score >= targetScore) clearInterval(tick);
      }, 30);

      // 2) Tailor
      setStep('tailor', 'loading');
      const tailored = await apiTailor({ resumeJson, resumeText, jdText: jobDescription });
      setTailoredMarkdown(tailored.tailoredMarkdown || '');
      setStep('tailor', 'done');
      toast.success('Resume tailored successfully! 🎯');
    } catch (err: any) {
      console.error(err);
      setStep('tailor', 'error');
      toast.error(err.message || 'Tailoring failed. Try again.');
    }
  };

  const handleExportDocx = async () => {
    if (!tailoredMarkdown) return toast.error('Generate the tailored resume first');
    try {
      setStep('export', 'loading');
      setDownloading(true);
      const blob = await apiExportDocx(tailoredMarkdown);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.docx';
      a.click();
      URL.revokeObjectURL(url);
      setStep('export', 'done');
      toast.success('DOCX downloaded');
    } catch (err: any) {
      console.error(err);
      setStep('export', 'error');
      toast.error('Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  const copyMarkdown = async () => {
    if (!previewMarkdown) return;
    await navigator.clipboard.writeText(previewMarkdown);
    toast.success('Markdown copied');
  };

  // Build keyword list for “Keyword Analysis” card
  const keywordRows = (() => {
    if (!analysis) return [];
    const matched = analysis.matchedKeywords.map(w => ({ word: w, matched: true, frequency: 1 }));
    const missing = analysis.missingKeywords.map(w => ({ word: w, matched: false, frequency: 0 }));
    return [...matched, ...missing].slice(0, 12);
  })();

  // ------------------- Subcomponents -------------------
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
        {icon}
        {label}
      </span>
    );
  };

  // helper to read visible text from ReactMarkdown children
function flattenText(children: any): string {
  if (Array.isArray(children)) return children.map(flattenText).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (children && typeof children === 'object' && 'props' in children) {
    return flattenText((children as any).props?.children);
  }
  return '';
}

const MarkdownPreview = ({ value }: { value: string }) => (
  <div className="px-4 py-3">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => (
          <h1
            className="text-3xl md:text-4xl font-semibold tracking-tight mb-1 text-[#0f2a43]"
            {...props}
          />
        ),
        h2: ({ node, ...props }) => {
          const txt = flattenText(props.children).trim().toLowerCase();
          const isExperience = txt === 'experience';
          return (
            <h2
              className={[
                // base H2 (+~1pt over your old preview)
                'font-semibold border-b pb-1 mt-6 mb-3',
                // size & color
                isExperience
                  ? 'text-[20px] md:text-[22px] text-[#0e6ba8]'
                  : 'text-[19px] md:text-[20px] text-[#12467F]',
              ].join(' ')}
              {...props}
            />
          );
        },
        p:  ({ node, ...props }) => (
          <p className="text-sm md:text-base leading-6 text-foreground/90" {...props} />
        ),
        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1.5" {...props} />,
        li: ({ node, ...props }) => <li className="text-sm md:text-base leading-6" {...props} />,
        a:  ({ node, ...props }) => (
          <a
            className="text-[#1155cc] underline underline-offset-2 hover:no-underline"
            target="_blank"
            rel="noreferrer"
            {...props}
          />
        ),
        hr: ({ node, ...props }) => <hr className="my-6 border-muted" {...props} />,
        strong: ({node, ...props}) => <strong className="font-semibold text-[#0e6ba8]" {...props} />,
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        code: ({ node, ...props }) => {
          // 'inline' is passed as a direct prop, not inside 'props'
          const inline = (props as any).inline;
          return inline ? (
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs" {...props} />
          ) : (
            <pre>
              <code className="block rounded bg-muted px-3 py-2 text-xs" {...props} />
            </pre>
          );
        },
      }}
    >
      {value}
    </ReactMarkdown>
  </div>
);

  // ------------------- UI -------------------
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Upload & Tailor</h1>
          <p className="text-muted-foreground mt-1">Upload your resume and job description. Preview and download a clean, ATS-safe tailored version.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* LEFT: Inputs */}
          <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
            {/* Pipeline */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-2">
                  <StepPill label="Parsing Resume"    status={steps.parse} />
                  <StepPill label="Normalizing JD"     status={steps.normalize} />
                  <StepPill label="Analyzing"          status={steps.analyze} />
                  <StepPill label="Tailoring"          status={steps.tailor} />
                  <StepPill label="Exporting"          status={steps.export} />
                </div>
              </CardContent>
            </Card>

            {/* Resume Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {!resumeUploaded ? (
                  <motion.div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    onClick={handleResumeUploadClick}
                  >
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Drop your resume here</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports DOCX and TXT (PDF coming soon)
                    </p>
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
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/20"
                  >
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full grid place-items-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium truncate">{resumeFileName}</p>
                      <p className="text-xs text-muted-foreground">Uploaded & parsed</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleResumeUploadClick}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Job Description
                </CardTitle>
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
                      placeholder="Paste the job description here..."
                      value={jobDescription}
                      onChange={async (e) => setJobDescription(e.target.value)}
                      rows={8}
                      className="resize-none"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{jobDescription.length} characters</span>
                      <span>Min 100 characters recommended</span>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={async () => {
                          try {
                            setStep('normalize', 'loading');
                            const { jdText } = await apiNormalizeJDFromText(jobDescription);
                            setJobDescription(jdText || '');
                            setStep('normalize', 'done');
                            toast.success('JD normalized');
                          } catch (e: any) {
                            setStep('normalize', 'error');
                            toast.error(e.message || 'Normalize failed');
                          }
                        }}
                        variant="secondary"
                        disabled={!jobDescription.trim()}
                      >
                        <Loader2 className="h-4 w-4 mr-2" />
                        Clean & Normalize
                      </Button>
                      <Button onClick={handleTailor} disabled={!resumeUploaded || !jobDescription.trim()}>
                        <Target className="h-4 w-4 mr-2" />
                        Generate Tailored Resume
                      </Button>
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
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Preview + actions */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              {/* sticky toolbar */}
              <div className="sticky top-0 z-10 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Tailored Resume Preview</span>
                    {steps.tailor === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyMarkdown} disabled={!previewMarkdown}>
                      <Clipboard className="h-4 w-4 mr-1.5" />
                      Copy Markdown
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info('Editor coming soon')}>
                      <FileEdit className="h-4 w-4 mr-1.5" />
                      Open in Editor
                    </Button>
                    <Button size="sm" onClick={handleExportDocx} disabled={!tailoredMarkdown || downloading}>
                      {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      Download DOCX
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

            {/* Changes Summary card (not exported) */}
            {changesMarkdown && (
              <Card>
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
                      ul: ({...props}) => <ul className="list-disc pl-5 space-y-1.5" {...props} />,
                      li: ({...props}) => <li className="text-sm leading-6" {...props} />,
                      p:  ({...props}) => <p className="text-sm leading-6" {...props} />,
                    }}
                  >
                    {changesMarkdown}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            )}

            {/* Insights moved to bottom */}
            {showResults && (
              <div className="space-y-6">
                {/* ATS Score */}
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
                        {analysis ? `Fit score: ${analysis.llmFitScore}/100` : 'Analyzing…'}
                      </p>
                    </div>
                    {analysis && (
                      <div className="space-y-3 mt-6">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Keyword overlap {(analysis.keywordOverlapScore * 100).toFixed(0)}%</span>
                        </div>
                        {analysis.notes?.[0] && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{analysis.notes[0]}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Keyword Analysis */}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
