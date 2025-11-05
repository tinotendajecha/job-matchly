/**
 * Template Registry - Manages resume templates
 * 
 * Templates are registered with their components, styles, and page configuration.
 * This allows switching templates without code changes - just select a different registry entry.
 */

import React from 'react';

export type PageSize = 'A4' | 'Letter';

export interface PageMargins {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface PageConfig {
  size: PageSize;
  margins: PageMargins;
}

export interface TemplateProps {
  data: ResumeData;
}

export interface ResumeData {
  header: {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website: string;
  };
  professionalSummary: string;
  skills: {
    technical: string[];
    soft: string[];
  };
  experience: Array<{
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    achievements: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }>;
  references: Array<{
    id: string;
    name: string;
    title: string;
    company: string;
    email: string;
    phone: string;
  }>;
  changesSummary: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  component: React.ComponentType<TemplateProps>;
  css: string | string[];
  page: PageConfig;
}

class TemplateRegistry {
  private templates: Map<string, ResumeTemplate> = new Map();

  register(template: ResumeTemplate): void {
    this.templates.set(template.id, template);
  }

  get(id: string): ResumeTemplate | undefined {
    return this.templates.get(id);
  }

  getAll(): ResumeTemplate[] {
    return Array.from(this.templates.values());
  }

  getDefault(): ResumeTemplate | undefined {
    return this.getAll()[0];
  }
}

// Export singleton instance
export const templateRegistry = new TemplateRegistry();

/**
 * Hook to get template and manage template selection
 * 
 * TODO: Add a "Choose Template" overlay/modal that uses this hook
 * This aligns with resume.io's flow where clicking preview opens the template selector
 */
export function useTemplate(templateId?: string) {
  const template = templateId
    ? templateRegistry.get(templateId)
    : templateRegistry.getDefault();

  return {
    template,
    availableTemplates: templateRegistry.getAll(),
    selectTemplate: (id: string) => templateRegistry.get(id),
  };
}

