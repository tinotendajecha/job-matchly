// app/api/resume-builder/export/pdf/route.ts
import { NextResponse } from "next/server";
import playwright from "playwright";
import playwrightCore from "playwright-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";

// Get template-specific CSS
function getTemplateStyles(template: 'classic' | 'modern' = 'classic'): string {
  if (template === 'modern') {
    return `
    @page {
      size: A4;
      margin: 18mm;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      color: #000;
      line-height: 1.6;
    }
    .section {
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 1.875rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: #2563eb;
    }
    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      margin-top: 1.5rem;
      color: #2563eb;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 0.25rem;
    }
    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #1f2937;
    }
    p {
      margin-bottom: 0.5rem;
      color: #374151;
    }
    ul {
      margin-left: 1rem;
      margin-bottom: 0.5rem;
    }
    li {
      margin-bottom: 0.25rem;
      color: #374151;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    .header-section {
      border-bottom: 2px solid #2563eb;
    }
    .experience-item,
    .education-item,
    .project-item,
    .certification-item,
    .reference-item {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 1rem;
    }
    .section {
      break-inside: auto;
    }
    h2, h3 {
      break-after: avoid;
    }
    p {
      widows: 2;
      orphans: 2;
    }
    `;
  }
  
  // Classic template (default)
  return `
    @page {
      size: A4;
      margin: 18mm;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      color: #000;
      line-height: 1.6;
    }
    .section {
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 1.875rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: #111827;
    }
    h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      margin-top: 1.5rem;
      color: #111827;
    }
    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #111827;
    }
    p {
      margin-bottom: 0.5rem;
      color: #374151;
    }
    ul {
      margin-left: 1rem;
      margin-bottom: 0.5rem;
    }
    li {
      margin-bottom: 0.25rem;
      color: #374151;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
    .header-section {
      border-bottom: 1px solid #d1d5db;
    }
    .experience-item,
    .education-item,
    .project-item,
    .certification-item,
    .reference-item {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 1rem;
    }
    .section {
      break-inside: auto;
    }
    h2, h3 {
      break-after: avoid;
    }
    p {
      widows: 2;
      orphans: 2;
    }
  `;
}

export async function POST(req: Request) {
  let browser = null;
  try {
    const { html, filename, template } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'html'." }, { status: 400 });
    }

    const templateType: 'classic' | 'modern' = template === 'modern' ? 'modern' : 'classic';
    const styles = getTemplateStyles(templateType);

    // Build full HTML document with template-specific styles
    const fullHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>${styles}</style>
</head>
<body>
  ${html}
</body>
</html>`;

    // Launch browser
    if (process.env.VERCEL) {
      const executablePath = await chromium.executablePath();
      browser = await playwrightCore.chromium.launch({
        args: chromium.args,
        executablePath: executablePath,
        headless: true,
      });
    } else {
      browser = await playwright.chromium.launch({
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle' });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '18mm',
        right: '18mm',
        bottom: '18mm',
        left: '18mm',
      },
    });

    const pdfBuffer = Buffer.from(pdfUint8Array);

    const bytes = new Uint8Array(pdfBuffer);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(filename && String(filename).trim()) || "resume.pdf"}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (err: any) {
    console.error("resume-builder/export/pdf fatal:", err?.stack || err?.message || err);
    return NextResponse.json({ ok: false, error: "Failed to export PDF." }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

