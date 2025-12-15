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

export type TailorTemplateId = 'classic' | 'twoColumn';

export type TailorTemplate = {
  id: TailorTemplateId;          // stable key
  label: string;                 // name shown in UI
  description: string;           // short explanation in dialog
  tone: string,
  density: string,
  previewVariant: string,
  exportVariant: string,
};
