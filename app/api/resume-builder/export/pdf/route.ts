// app/api/resume-builder/export/pdf/route.ts
import { NextResponse } from "next/server";
import playwright from "playwright";
import playwrightCore from "playwright-core";
import chromium from "@sparticuz/chromium";
import path from "path";
import fs from "fs";
import { getTemplateMeta } from "@/app/app/builder/lib/templates-meta";

export const runtime = "nodejs";

// Attempt to resolve and read CSS content from a web-style path
function tryReadCss(cssPath: string): string {
  if (!cssPath) return '';
  const normalized = cssPath.replace(/^\//, '');
  const candidates = [
    path.join(process.cwd(), normalized),
    path.join(process.cwd(), 'app', normalized),
    path.join(process.cwd(), 'app', 'app', normalized),
    path.join(process.cwd(), 'src', normalized),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf-8');
      }
    } catch {/* ignore */}
  }
  return '';
}

// Minimal fallback CSS to preserve pagination behavior if file can't be read
const DEFAULT_BREAK_CSS = `
/* Fallback print break rules */
@page { margin: 18mm; }
.experience-item,
.education-item,
.project-item,
.certification-item,
.reference-item,
li { break-inside: avoid; page-break-inside: avoid; }
.section { break-inside: auto; page-break-inside: auto; margin-bottom: 1.5rem; }
h1, h2, h3, h4, h5, h6 { break-after: avoid; page-break-after: avoid; }
p { orphans: 2; widows: 2; }
`;

export async function POST(req: Request) {
  let browser = null;
  try {
    const { html, filename, template, templateId } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'html'." }, { status: 400 });
    }

    // Prefer templateId, but accept legacy 'template'
    const selectedId: string | null = (typeof templateId === 'string' && templateId)
      || (typeof template === 'string' && template)
      || null;
    const meta = getTemplateMeta(selectedId);

    // Load CSS file(s)
    const cssPaths = Array.isArray(meta.css) ? meta.css : [meta.css];
    const loadedCss = cssPaths.map(tryReadCss).filter(Boolean).join('\n\n') || DEFAULT_BREAK_CSS;

    // Build dynamic @page with metadata margins/size (placed after loaded CSS to ensure specificity)
    const pageCss = `@page { size: ${meta.page.size}; margin: ${meta.page.margins.top} ${meta.page.margins.right} ${meta.page.margins.bottom} ${meta.page.margins.left}; }`;
    const styles = `${loadedCss}\n\n${pageCss}`;

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
      // Use template page config
      format: meta.page.size as any,
      printBackground: true,
      margin: {
        top: meta.page.margins.top,
        right: meta.page.margins.right,
        bottom: meta.page.margins.bottom,
        left: meta.page.margins.left,
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

