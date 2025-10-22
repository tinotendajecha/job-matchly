import { useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { apiParseResume } from '../helpers/api';
import type { StepStatus } from '../types';

interface StepOneProps {
  resumeParsed: boolean;
  resumeFileName: string;
  steps: { parse: StepStatus };
  onResumeParsed: (data: any) => void;
  onStepChange: (step: number) => void;
  onSetStepStatus: (step: 'parse' | 'normalize' | 'analyze' | 'tailor' | 'export', status: StepStatus) => void;
  router: any;
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

export const StepOne = ({ 
  resumeParsed, 
  resumeFileName, 
  steps, 
  onResumeParsed, 
  onStepChange, 
  onSetStepStatus,
  router 
}: StepOneProps) => {
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

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
      onSetStepStatus('parse', 'loading');
      const data = await apiParseResume(file, router);
      onResumeParsed({
        fileName: file.name,
        resumeText: data.resumeText || '',
        resumeJson: data.resumeJson || null,
        parsed: true
      });
      onSetStepStatus('parse', 'done');
      toast.success('Resume parsed successfully! ✅');
      onStepChange(2);
    } catch (err: any) {
      console.error(err);
      onSetStepStatus('parse', 'error');
      toast.error(err.message || 'Could not parse resume.');
    }
  };

  return (
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
                  We will  parse it and prep it for tailoring.
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
                onStepChange(2);
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
  );
};
