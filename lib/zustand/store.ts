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
  generatedResumeTitle: string,
  setGeneratedResumeTitle: (s: string) => void,

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

      generatedResumeTitle: '',
      setGeneratedResumeTitle: (s) => set({generatedResumeTitle: s}),

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
          generatedResumeTitle: '',
          steps: { parse: 'idle', normalize: 'idle', analyze: 'idle', tailor: 'idle', export: 'idle' },
          downloadFmt: 'docx',
          generatedCoverLetter: '',
          generatedCoverTitle: ''
        }),
    }),
    { name: 'tailor-wizard' }
  )
);

// Resume Builder Store
type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  achievements: string[];
};

type EducationItem = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
};

type ProjectItem = {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
};

type CertificationItem = {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
};

type ReferenceItem = {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
};

type ResumeBuilderStore = {
  // Header
  header: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website: string;
  };
  setHeader: (header: Partial<ResumeBuilderStore['header']>) => void;

  // Professional Summary
  professionalSummary: string;
  setProfessionalSummary: (summary: string) => void;

  // Skills
  skills: {
    technical: string[];
    soft: string[];
  };
  setSkills: (skills: Partial<ResumeBuilderStore['skills']>) => void;
  addSkill: (type: 'technical' | 'soft', skill: string) => void;
  removeSkill: (type: 'technical' | 'soft', index: number) => void;

  // Experience
  experience: ExperienceItem[];
  setExperience: (experience: ExperienceItem[]) => void;
  addExperience: () => void;
  updateExperience: (id: string, updates: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  addExperienceAchievement: (id: string, achievement: string) => void;
  removeExperienceAchievement: (id: string, achievementIndex: number) => void;

  // Education
  education: EducationItem[];
  setEducation: (education: EducationItem[]) => void;
  addEducation: () => void;
  updateEducation: (id: string, updates: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;

  // Projects (conditional)
  projects: ProjectItem[];
  setProjects: (projects: ProjectItem[]) => void;
  addProject: () => void;
  updateProject: (id: string, updates: Partial<ProjectItem>) => void;
  removeProject: (id: string) => void;
  addProjectTechnology: (id: string, technology: string) => void;
  removeProjectTechnology: (id: string, techIndex: number) => void;

  // Certifications (if applicable)
  certifications: CertificationItem[];
  setCertifications: (certifications: CertificationItem[]) => void;
  addCertification: () => void;
  updateCertification: (id: string, updates: Partial<CertificationItem>) => void;
  removeCertification: (id: string) => void;

  // References (conditional)
  references: ReferenceItem[];
  setReferences: (references: ReferenceItem[]) => void;
  addReference: () => void;
  updateReference: (id: string, updates: Partial<ReferenceItem>) => void;
  removeReference: (id: string) => void;

  // Changes Summary
  changesSummary: string;
  setChangesSummary: (summary: string) => void;

  // Template
  activeTemplate: 'classic' | 'modern';
  setActiveTemplate: (template: 'classic' | 'modern') => void;

  // Reset
  resetResume: () => void;
};

export const useCreateResumeStore = create<ResumeBuilderStore>()(
  persist(
    (set, get) => ({
      // Header
      header: {
        name: '',
        title: '',
        email: '',
        phone: '',
        location: '',
        website: '',
      },
      setHeader: (header) => set((state) => ({ header: { ...state.header, ...header } })),

      // Professional Summary
      professionalSummary: '',
      setProfessionalSummary: (summary) => set({ professionalSummary: summary }),

      // Skills
      skills: {
        technical: [],
        soft: [],
      },
      setSkills: (skills) => set((state) => ({ skills: { ...state.skills, ...skills } })),
      addSkill: (type, skill) =>
        set((state) => ({
          skills: {
            ...state.skills,
            [type]: [...state.skills[type], skill],
          },
        })),
      removeSkill: (type, index) =>
        set((state) => ({
          skills: {
            ...state.skills,
            [type]: state.skills[type].filter((_, i) => i !== index),
          },
        })),

      // Experience
      experience: [],
      setExperience: (experience) => set({ experience }),
      addExperience: () =>
        set((state) => ({
          experience: [
            ...state.experience,
            {
              id: `exp-${Date.now()}`,
              company: '',
              role: '',
              startDate: '',
              endDate: '',
              isCurrent: false,
              achievements: [],
            },
          ],
        })),
      updateExperience: (id, updates) =>
        set((state) => ({
          experience: state.experience.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)),
        })),
      removeExperience: (id) =>
        set((state) => ({
          experience: state.experience.filter((exp) => exp.id !== id),
        })),
      addExperienceAchievement: (id, achievement) =>
        set((state) => ({
          experience: state.experience.map((exp) =>
            exp.id === id ? { ...exp, achievements: [...exp.achievements, achievement] } : exp
          ),
        })),
      removeExperienceAchievement: (id, achievementIndex) =>
        set((state) => ({
          experience: state.experience.map((exp) =>
            exp.id === id
              ? { ...exp, achievements: exp.achievements.filter((_, i) => i !== achievementIndex) }
              : exp
          ),
        })),

      // Education
      education: [],
      setEducation: (education) => set({ education }),
      addEducation: () =>
        set((state) => ({
          education: [
            ...state.education,
            {
              id: `edu-${Date.now()}`,
              institution: '',
              degree: '',
              fieldOfStudy: '',
              graduationYear: '',
            },
          ],
        })),
      updateEducation: (id, updates) =>
        set((state) => ({
          education: state.education.map((edu) => (edu.id === id ? { ...edu, ...updates } : edu)),
        })),
      removeEducation: (id) =>
        set((state) => ({
          education: state.education.filter((edu) => edu.id !== id),
        })),

      // Projects
      projects: [],
      setProjects: (projects) => set({ projects }),
      addProject: () =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              id: `proj-${Date.now()}`,
              name: '',
              description: '',
              technologies: [],
              url: '',
            },
          ],
        })),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((proj) => (proj.id === id ? { ...proj, ...updates } : proj)),
        })),
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((proj) => proj.id !== id),
        })),
      addProjectTechnology: (id, technology) =>
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === id ? { ...proj, technologies: [...proj.technologies, technology] } : proj
          ),
        })),
      removeProjectTechnology: (id, techIndex) =>
        set((state) => ({
          projects: state.projects.map((proj) =>
            proj.id === id ? { ...proj, technologies: proj.technologies.filter((_, i) => i !== techIndex) } : proj
          ),
        })),

      // Certifications
      certifications: [],
      setCertifications: (certifications) => set({ certifications }),
      addCertification: () =>
        set((state) => ({
          certifications: [
            ...state.certifications,
            {
              id: `cert-${Date.now()}`,
              name: '',
              issuer: '',
              date: '',
              expiryDate: '',
            },
          ],
        })),
      updateCertification: (id, updates) =>
        set((state) => ({
          certifications: state.certifications.map((cert) =>
            cert.id === id ? { ...cert, ...updates } : cert
          ),
        })),
      removeCertification: (id) =>
        set((state) => ({
          certifications: state.certifications.filter((cert) => cert.id !== id),
        })),

      // References
      references: [],
      setReferences: (references) => set({ references }),
      addReference: () =>
        set((state) => ({
          references: [
            ...state.references,
            {
              id: `ref-${Date.now()}`,
              name: '',
              title: '',
              company: '',
              email: '',
              phone: '',
            },
          ],
        })),
      updateReference: (id, updates) =>
        set((state) => ({
          references: state.references.map((ref) => (ref.id === id ? { ...ref, ...updates } : ref)),
        })),
      removeReference: (id) =>
        set((state) => ({
          references: state.references.filter((ref) => ref.id !== id),
        })),

      // Changes Summary
      changesSummary: '',
      setChangesSummary: (summary) => set({ changesSummary: summary }),

      // Template
      activeTemplate: 'classic',
      setActiveTemplate: (template) => set({ activeTemplate: template }),

      // Reset
      resetResume: () =>
        set({
          header: {
            name: '',
            title: '',
            email: '',
            phone: '',
            location: '',
            website: '',
          },
          professionalSummary: '',
          skills: {
            technical: [],
            soft: [],
          },
          experience: [],
          education: [],
          projects: [],
          certifications: [],
          references: [],
          changesSummary: '',
          activeTemplate: 'classic',
        }),
    }),
    { name: 'resume-builder' }
  )
);
