/**
 * Shared Template Metadata (server-safe)
 *
 * Contains non-React data for templates that can be imported
 * by both client and server (e.g., API routes).
 */

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

export interface TemplateMeta {
  id: 'classic' | 'modern';
  name: string;
  css: string | string[]; // path(s) to CSS; server may resolve and inline
  page: PageConfig;
}

export const TEMPLATE_IDS = {
  CLASSIC: 'classic',
  MODERN: 'modern',
} as const;

export const TEMPLATES_META: Record<TemplateMeta['id'], TemplateMeta> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    css: ['/app/builder/styles/print.css', '/app/builder/styles/export-base.css'],
    page: {
      size: 'A4',
      margins: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    css: ['/app/builder/styles/print.css', '/app/builder/styles/export-base.css'],
    page: {
      size: 'A4',
      margins: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
    },
  },
};

export function getTemplateMeta(id?: string | null): TemplateMeta {
  if (id === 'modern') return TEMPLATES_META.modern;
  return TEMPLATES_META.classic; // default
}
