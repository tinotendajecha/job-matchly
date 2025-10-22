import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Upload, 
  CheckCheck, 
  Lightbulb, 
  Sparkles 
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { apiNormalizeJDFromText, apiAnalyze, apiTailor } from '../helpers/api';
import type { StepStatus } from '../types';

interface StepTwoProps {
  jobDescription: string;
  resumeText: string;
  resumeJson: any;
  resumeParsed: boolean;
  jdProvided: boolean;
  activeTab: string;
  imageOCRDone: boolean;
  jdImageName: string;
  steps: {
    normalize: StepStatus;
    analyze: StepStatus;
    tailor: StepStatus;
  };
  onJobDescriptionChange: (value: string) => void;
  onJdProvidedChange: (value: boolean) => void;
  onActiveTabChange: (tab: string) => void;
  onImageOCRDoneChange: (done: boolean) => void;
  onJdImageNameChange: (name: string) => void;
  onStepChange: (step: number) => void;
  onAnalysisComplete: (analysis: any) => void;
  onTailoredMarkdownChange: (markdown: string) => void;
  onAtsScoreChange: (score: number) => void;
  onResetOCR: () => void;
  onSetStepStatus: (step: 'parse' | 'normalize' | 'analyze' | 'tailor' | 'export', status: StepStatus) => void;
}

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

export const StepTwo = ({
  jobDescription,
  resumeText,
  resumeJson,
  resumeParsed,
  jdProvided,
  activeTab,
  imageOCRDone,
  jdImageName,
  steps,
  onJobDescriptionChange,
  onJdProvidedChange,
  onActiveTabChange,
  onImageOCRDoneChange,
  onJdImageNameChange,
  onStepChange,
  onAnalysisComplete,
  onTailoredMarkdownChange,
  onAtsScoreChange,
  onResetOCR,
  onSetStepStatus
}: StepTwoProps) => {
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLang] = useState<'eng'>('eng');

  // OCR (client)
  async function ocrImageInBrowser(file: File) {
    onActiveTabChange('image');
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
      onJobDescriptionChange(jdText || raw);
      onJdProvidedChange(true);
      onImageOCRDoneChange(true);
      onJdImageNameChange(file.name);
      toast.success('Extracted text from image 🪄');

      onActiveTabChange('text'); // go back to text with filled JD
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
      onSetStepStatus('normalize', 'loading');
      const { jdText } = await apiNormalizeJDFromText(jobDescription);
      const finalJD = jdText || jobDescription;
      onJobDescriptionChange(finalJD);
      onJdProvidedChange(true);
      onSetStepStatus('normalize', 'done');

      // 2) analyze
      onSetStepStatus('analyze', 'loading');
      const analysisRes = await apiAnalyze(resumeText, finalJD);
      onAnalysisComplete(analysisRes);
      onSetStepStatus('analyze', 'done');

      // score animation
      const targetScore = Math.max(0, Math.min(100, analysisRes.llmFitScore ?? 75));
      let s = 0;
      const timer = setInterval(() => {
        s = Math.min(targetScore, s + 2);
        onAtsScoreChange(s);
        if (s >= targetScore) clearInterval(timer);
      }, 22);

      // 3) tailor
      onSetStepStatus('tailor', 'loading');
      const tailored = await apiTailor({ resumeJson, resumeText, jdText: finalJD });
      onTailoredMarkdownChange(tailored.tailoredMarkdown || '');
      onSetStepStatus('tailor', 'done');
      toast.success('Tailored and ready! ✨');
      onStepChange(3);
    } catch (err: any) {
      console.error(err);
      onSetStepStatus('tailor', 'error');
      toast.error(err.message || 'Tailoring failed. Try again.');
    }
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
    steps.analyze === 'loading' || steps.tailor === 'loading';

  return (
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
          <Tabs value={activeTab} onValueChange={(v) => onActiveTabChange(v)} className="w-full">
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
                    onJobDescriptionChange(e.target.value);
                    onJdProvidedChange(!!e.target.value.trim());
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
                  onClick={() => onStepChange(1)}
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
                        onClick={() => onActiveTabChange('text')}
                        className="w-full sm:w-auto"
                      >
                        View Text
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetOCR}
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
              onClick={() => onStepChange(1)}
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
  );
};
