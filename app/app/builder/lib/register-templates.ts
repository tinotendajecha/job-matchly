/**
 * Register Templates
 * 
 * This file registers all available resume templates with the template registry.
 * To add a new template, import it and register it here.
 */

import { templateRegistry, ResumeTemplate } from './template-registry';
import { ClassicTemplate } from '../templates/ClassicTemplate';
import { ModernTemplate } from '../templates/ModernTemplate';

// Register Classic Template
export const classicTemplate: ResumeTemplate = {
  id: 'classic',
  name: 'Classic',
  component: ClassicTemplate,
  css: '/app/builder/styles/print.css',
  page: {
    size: 'A4',
    margins: {
      top: '18mm',
      right: '18mm',
      bottom: '18mm',
      left: '18mm',
    },
  },
};

// Register Modern Template
export const modernTemplate: ResumeTemplate = {
  id: 'modern',
  name: 'Modern',
  component: ModernTemplate,
  css: '/app/builder/styles/print.css',
  page: {
    size: 'A4',
    margins: {
      top: '18mm',
      right: '18mm',
      bottom: '18mm',
      left: '18mm',
    },
  },
};

// Register all templates
templateRegistry.register(classicTemplate);
templateRegistry.register(modernTemplate);

// Export template IDs for easy reference
export const TEMPLATE_IDS = {
  CLASSIC: 'classic',
  MODERN: 'modern',
} as const;

