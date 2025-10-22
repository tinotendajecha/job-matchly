export type Analysis = {
  ok: boolean;
  keywordOverlapScore: number;
  llmFitScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  notes: string[];
};

export type StepStatus = 'idle' | 'loading' | 'done' | 'error';
export type WizardStep = 1 | 2 | 3;
