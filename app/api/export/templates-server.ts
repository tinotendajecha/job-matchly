import { TailorTemplateId } from "@/app/app/upload-tailor/types";

type ServerTemplate = {
  id: TailorTemplateId;
  css: string;           // or later: path to CSS file
  bodyClass?: string;    // optional extra class for <body>
};


export const SERVER_TEMPLATES: Record<TailorTemplateId, ServerTemplate> = {
  classic: {
    id: 'classic',
    css: `
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #111; }
  h1 { font-size: 24pt; letter-spacing: 0.3pt; margin: 0 0 8pt 0; color: #0f2a43; }
  h2 { font-size: 14pt; margin: 16pt 0 8pt 0; padding-bottom: 2pt; border-bottom: 1px solid #dcdcdc; color: #12467F; }
  h2.exp { font-size: 15pt; color: #0e6ba8; }
  section.exp p.jobline { margin: 8pt 0 6pt 0; font-size: 12pt; }
  section.exp p.jobline strong { color: #0e6ba8; font-weight: 700; }
  p { margin: 6pt 0; font-size: 11pt; line-height: 1.6; }
  ul { margin: 6pt 0 8pt 18pt; padding: 0; }
  li { margin: 4pt 0; font-size: 11pt; line-height: 1.5; }
  a { color: #1155cc; text-decoration: none; }
  h1 + p { color: #333; margin-top: 4pt; }
  /* Enhanced cover letter formatting */
  .cover-letter p { margin: 8pt 0; line-height: 1.7; }
  .cover-letter h1 { font-size: 20pt; margin-bottom: 12pt; }
  .cover-letter h2 { font-size: 16pt; margin: 14pt 0 10pt 0; }
    `,
  },
  twoColumn: {
    id: 'twoColumn',
    css: `
      /* TODO: two-column export CSS */
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #a71010ff; }
    `,
    bodyClass: 'two-column',
  },
  // add more templates here
};

// const CSS = `
//   body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #111; }
//   h1 { font-size: 24pt; letter-spacing: 0.3pt; margin: 0 0 8pt 0; color: #0f2a43; }
//   h2 { font-size: 14pt; margin: 16pt 0 8pt 0; padding-bottom: 2pt; border-bottom: 1px solid #dcdcdc; color: #12467F; }
//   h2.exp { font-size: 15pt; color: #0e6ba8; }
//   section.exp p.jobline { margin: 8pt 0 6pt 0; font-size: 12pt; }
//   section.exp p.jobline strong { color: #0e6ba8; font-weight: 700; }
//   p { margin: 6pt 0; font-size: 11pt; line-height: 1.6; }
//   ul { margin: 6pt 0 8pt 18pt; padding: 0; }
//   li { margin: 4pt 0; font-size: 11pt; line-height: 1.5; }
//   a { color: #1155cc; text-decoration: none; }
//   h1 + p { color: #333; margin-top: 4pt; }
//   /* Enhanced cover letter formatting */
//   .cover-letter p { margin: 8pt 0; line-height: 1.7; }
//   .cover-letter h1 { font-size: 20pt; margin-bottom: 12pt; }
//   .cover-letter h2 { font-size: 16pt; margin: 14pt 0 10pt 0; }
// `;