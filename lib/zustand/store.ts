// lib/zustand/store.ts
// ---- NEW: Zustand store (persist progress across refreshes)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type StepStatus = 'idle' | 'loading' | 'done' | 'error';
type WizardStep = 1 | 2 | 3;

type Analysis = {
  ok: boolean;
  keywordOverlapScore: number;
  llmFitScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  notes: string[];
};

type Store = {
  // wizard
  step: WizardStep;
  setStep: (s: WizardStep) => void;

  // resume
  resumeParsed: boolean;
  setResumeParsed: (v: boolean) => void;
  resumeFileName: string;
  setResumeFileName: (s: string) => void;
  resumeText: string;
  setResumeText: (s: string) => void;
  resumeJson: any;
  setResumeJson: (v: any) => void;

  // JD
  jobDescription: string;
  setJobDescription: (s: string) => void;
  jdProvided: boolean;
  setJdProvided: (v: boolean) => void;
  activeTab: 'text' | 'image' | 'upload' | 'url';
  setActiveTab: (v: 'text' | 'image' | 'upload' | 'url') => void;

  // OCR success
  imageOCRDone: boolean;
  setImageOCRDone: (v: boolean) => void;
  jdImageName: string;
  setJdImageName: (s: string) => void;

  // results
  analysis: Analysis | null;
  setAnalysis: (a: Analysis | null) => void;
  atsScore: number;
  setAtsScore: (n: number) => void;
  tailoredMarkdown: string;
  setTailoredMarkdown: (s: string) => void;

  // Cover Letter
  generatedCoverLetter: string;
  setGeneratedCoverLetter: (s: string) => void;
  generatedCoverTitle: string;
  setGeneratedCoverTitle: (s: string) => void;

  // pipeline badges
  steps: Record<'parse' | 'normalize' | 'analyze' | 'tailor' | 'export', StepStatus>;
  setStepStatus: (k: keyof Store['steps'], v: StepStatus) => void;

  // download format
  downloadFmt: 'docx' | 'pdf';
  setDownloadFmt: (v: 'docx' | 'pdf') => void;

  // resets
  resetOCR: () => void;
  resetAll: () => void;
};

export const useTailorStore = create<Store>()(
  persist(
    (set, get) => ({
      step: 1,
      setStep: (s) => set({ step: s }),

      resumeParsed: false,
      setResumeParsed: (v) => set({ resumeParsed: v }),
      resumeFileName: '',
      setResumeFileName: (s) => set({ resumeFileName: s }),
      resumeText: '',
      setResumeText: (s) => set({ resumeText: s }),
      resumeJson: null,
      setResumeJson: (v) => set({ resumeJson: v }),

      jobDescription: '',
      setJobDescription: (s) => set({ jobDescription: s }),
      jdProvided: false,
      setJdProvided: (v) => set({ jdProvided: v }),
      activeTab: 'text',
      setActiveTab: (v) => set({ activeTab: v }),

      imageOCRDone: false,
      setImageOCRDone: (v) => set({ imageOCRDone: v }),
      jdImageName: '',
      setJdImageName: (s) => set({ jdImageName: s }),

      analysis: null,
      setAnalysis: (a) => set({ analysis: a }),
      atsScore: 0,
      setAtsScore: (n) => set({ atsScore: n }),
      tailoredMarkdown: '',
      setTailoredMarkdown: (s) => set({ tailoredMarkdown: s }),

      // For Cover Letter
      generatedCoverLetter: '',
      setGeneratedCoverLetter: (s) => set({ generatedCoverLetter: s}),

      generatedCoverTitle: '',
      setGeneratedCoverTitle: (s) => set({ generatedCoverTitle: s}),

      steps: { parse: 'idle', normalize: 'idle', analyze: 'idle', tailor: 'idle', export: 'idle' },
      setStepStatus: (k, v) => set({ steps: { ...get().steps, [k]: v } }),

      downloadFmt: 'docx',
      setDownloadFmt: (v) => set({ downloadFmt: v }),

      resetOCR: () =>
        set({
          imageOCRDone: false,
          jdImageName: '',
          jobDescription: '',
          jdProvided: false,
          activeTab: 'image',
        }),

      resetAll: () =>
        set({
          step: 1,
          resumeParsed: false,
          resumeFileName: '',
          resumeText: '',
          resumeJson: null,
          jobDescription: '',
          jdProvided: false,
          activeTab: 'text',
          imageOCRDone: false,
          jdImageName: '',
          analysis: null,
          atsScore: 0,
          tailoredMarkdown: '',
          steps: { parse: 'idle', normalize: 'idle', analyze: 'idle', tailor: 'idle', export: 'idle' },
          downloadFmt: 'docx',
          generatedCoverLetter: '',
          generatedCoverTitle: ''
        }),
    }),
    { name: 'tailor-wizard' }
  )
);
