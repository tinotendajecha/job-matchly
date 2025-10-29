import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'react-toastify';
import type { StepStatus } from '../types';
// import { useTailorStore } from '../store/tailorStore';
import { useTailorStore } from '@/lib/zustand/store';

interface WizardStepperProps {
  steps: {
    parse: StepStatus;
    normalize: StepStatus;
    analyze: StepStatus;
    tailor: StepStatus;
    export: StepStatus;
  };
}

const StepPill = ({ label, status }: { label: string; status: StepStatus }) => {
  // Always show icon, show text only on desktop
  const icon =
    status === 'loading' ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : status === 'done' ? (
      <CheckCircle className="h-4 w-4 text-primary" />
    ) : status === 'error' ? (
      <AlertTriangle className="h-4 w-4 text-destructive" />
    ) : (
      <div className="h-4 w-4 rounded-full bg-muted border-2 border-border" />
    );

  // Use your theme colors
  const tone =
    status === 'done'
      ? 'bg-primary/10 text-primary border-primary/20'
      : status === 'loading'
      ? 'bg-primary/10 text-primary border-primary/30'
      : status === 'error'
      ? 'bg-destructive/10 text-destructive border-destructive/20'
      : 'bg-muted text-muted-foreground border-border';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 sm:py-1 text-xs font-medium transition-all border ${tone}`}
      title={label} // Show label on hover for mobile
    >
      {icon}
      <span className="sm:inline">{label}</span>
    </span>
  );
};

export const WizardStepper = ({ steps }: WizardStepperProps) => {
  const { resetAll, setStep } = useTailorStore();

  const hasActiveProcess = Object.values(steps).some((s) => s === 'loading');
  const hasError = Object.values(steps).some((s) => s === 'error');

  const handleReset = () => {
    resetAll();
    setStep(1);
    toast.success('Process reset. Starting fresh! 🔄');
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Progress Pills */}
          <div className="flex flex-wrap gap-2">
            <StepPill label="Parsing" status={steps.parse} />
            <StepPill label="Normalizing" status={steps.normalize} />
            <StepPill label="Analyzing" status={steps.analyze} />
            <StepPill label="Tailoring" status={steps.tailor} />
            <StepPill label="Exporting" status={steps.export} />
          </div>

          {/* Reset Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  hasError
                    ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {hasError ? 'Stuck? Reset' : hasActiveProcess ? 'Cancel & Reset' : 'Start Over'}
                </span>
                <span className="sm:hidden">Reset</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-destructive" />
                  {hasError ? 'Reset Process?' : 'Start Over?'}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left space-y-2">
                  {hasError ? (
                    <>
                      <p>It looks like something went wrong. Resetting will:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Clear any errors</li>
                        <li>Reset all progress</li>
                        <li>Return you to the beginning</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">
                        Your uploaded resume and job description will be cleared.
                      </p>
                    </>
                  ) : hasActiveProcess ? (
                    <>
                      <p>This will cancel the current process and clear all progress.</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        You'll need to start from the beginning with a fresh upload.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>This will clear your current session including:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Uploaded resume</li>
                        <li>Job description</li>
                        <li>Generated content</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">This action cannot be undone.</p>
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {hasError ? 'Reset Now' : 'Start Over'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
