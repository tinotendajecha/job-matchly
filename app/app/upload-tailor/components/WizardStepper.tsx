import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { StepStatus } from '../types';

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

export const WizardStepper = ({ steps }: WizardStepperProps) => (
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
