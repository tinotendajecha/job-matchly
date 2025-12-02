/**
 * Register Templates
 * 
 * This file registers all available resume templates with the template registry.
 * To add a new template, import it and register it here.
 */

import { templateRegistry, ResumeTemplate } from './template-registry';
import { ClassicTemplate } from '../templates/ClassicTemplate';
import { ModernTemplate } from '../templates/ModernTemplate';
import { TEMPLATES_META, TEMPLATE_IDS } from './templates-meta';

// Register Classic Template
export const classicTemplate: ResumeTemplate = {
  ...TEMPLATES_META.classic,
  component: ClassicTemplate,
};

// Register Modern Template
export const modernTemplate: ResumeTemplate = {
  ...TEMPLATES_META.modern,
  component: ModernTemplate,
};

// Register all templates
templateRegistry.register(classicTemplate);
templateRegistry.register(modernTemplate);

// Export template IDs for easy reference
export { TEMPLATE_IDS };

