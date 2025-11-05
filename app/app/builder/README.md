# Resume Builder - Multi-Page Pagination

This directory contains the resume builder with true multi-page pagination using Paged.js.

## Installation

To enable full pagination features, install Paged.js:

```bash
npm install pagedjs
```

The system includes a fallback pagination mechanism if Paged.js is not installed, but for the best experience (especially print/PDF export matching screen preview), install Paged.js.

## Architecture

### Core Components

1. **Pagination Engine** (`lib/pagination-engine.ts`)
   - Wraps Paged.js for DOM pagination
   - Provides fallback if Paged.js not installed
   - Returns total pages and pagination flow

2. **usePagination Hook** (`lib/usePagination.ts`)
   - React hook for automatic pagination
   - Debounces pagination on content changes
   - Returns total pages, loading state, and error handling

3. **PageNavigator** (`components/PageNavigator.tsx`)
   - UI component for page navigation
   - Supports keyboard (Arrow keys, Page Up/Down)
   - Shows current page / total pages

4. **Template Registry** (`lib/template-registry.ts`)
   - Manages resume templates
   - Allows switching templates without code changes
   - Each template has its own component and CSS

5. **Templates** (`templates/`)
   - `ClassicTemplate.tsx` - Classic resume style
   - `ModernTemplate.tsx` - Modern resume style with blue accents

6. **Print CSS** (`styles/print.css`)
   - Shared pagination rules for all templates
   - `@page` rules for A4/Letter sizing
   - `break-inside: avoid` for atomic blocks (experience items, etc.)

### Usage

The `ResumePreview` component automatically:
- Paginates content using Paged.js (or fallback)
- Shows page navigator with "1 / N" display
- Handles keyboard navigation
- Updates pagination when content changes (debounced)

### Template Selection

Templates are registered in `lib/register-templates.ts`. To add a new template:

1. Create a new template component in `templates/`
2. Register it in `register-templates.ts`
3. The template will automatically be available

### Future Enhancements

- Template chooser modal (TODO: Add template selector overlay)
- PDF export (see `@react-pdf/renderer` as alternative renderer)
- URL query parameter sync for current page
- Analytics for page count tracking

## Testing Print

To test print preview:
1. Ensure Paged.js is installed
2. Open browser print preview (Ctrl+P / Cmd+P)
3. Page breaks should match on-screen preview exactly

