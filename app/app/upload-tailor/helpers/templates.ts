import type { TailorTemplate, TailorTemplateId } from '../types';

export const TAILOR_TEMPLATES: Record<TailorTemplateId, TailorTemplate> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    description: 'Single-column, ATS-friendly layout.',
    tone: 'neutral',
    density: 'medium',
    previewVariant: 'classic',
    exportVariant: 'classic',
  },
  twoColumn: {
    id: 'twoColumn',
    label: 'Creative Two-Column',
    description: 'Left sidebar with name/skills, right column with experience.',
    tone: 'friendly',
    density: 'medium',
    previewVariant: 'twoColumn',
    exportVariant: 'twoColumn',
  },
};
