// app/api/resume-builder/export/pdf/route.ts
import { NextResponse } from "next/server";
import playwright from "playwright";
import playwrightCore from "playwright-core";
import chromium from "@sparticuz/chromium";
import path from "path";
import fs from "fs";
import { getTemplateMeta } from "@/app/app/builder/lib/templates-meta";

export const runtime = "nodejs";

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
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
    } catch { /* ignore */ }
  }
  return '';
}

const LEGACY_BREAK_CSS = `
@page { margin: 18mm; }
.experience-item,.education-item,.project-item,.certification-item,.reference-item,li{break-inside:avoid;page-break-inside:avoid}
.section{break-inside:auto;page-break-inside:auto;margin-bottom:1.5rem}
h1,h2,h3,h4,h5,h6{break-after:avoid;page-break-after:avoid}
p{orphans:2;widows:2}
`;

export async function POST(req: Request) {
  let browser = null;
  try {
    const { html, filename, template, templateId } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'html'." }, { status: 400 });
    }

    // Detect whether the client sent a complete HTML document (new path) or just a body fragment (legacy)
    const isFullDoc = /^\s*<!doctype\s+html/i.test(html);

    let fullHtml: string;
    let pdfMargins: { top: string; right: string; bottom: string; left: string };

    if (isFullDoc) {
      // New path: CSS @page { margin: 18mm } inside the full HTML document handles per-page
      // margins during layout (Chromium applies this to every page including page 2+).
      // Playwright margin must be 0 — if both are non-zero they stack, doubling the margin.
      fullHtml = html;
      pdfMargins = { top: '0', right: '0', bottom: '0', left: '0' };
    } else {
      // Legacy path: body-only HTML — wrap with template CSS
      const selectedId: string | null = (typeof templateId === 'string' && templateId)
        || (typeof template === 'string' && template)
        || null;
      const meta = getTemplateMeta(selectedId);
      const cssPaths = Array.isArray(meta.css) ? meta.css : [meta.css];
      const loadedCss = cssPaths.map(tryReadCss).filter(Boolean).join('\n\n') || LEGACY_BREAK_CSS;
      const pageCss = `@page{size:${meta.page.size};margin:${meta.page.margins.top} ${meta.page.margins.right} ${meta.page.margins.bottom} ${meta.page.margins.left}}`;
      fullHtml = `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<style>${loadedCss}\n${pageCss}</style>\n</head>\n<body>${html}</body>\n</html>`;
      pdfMargins = {
        top: meta.page.margins.top,
        right: meta.page.margins.right,
        bottom: meta.page.margins.bottom,
        left: meta.page.margins.left,
      };
    }

    // Launch browser
    if (process.env.VERCEL) {
      const executablePath = await chromium.executablePath();
      browser = await playwrightCore.chromium.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      });
    } else {
      browser = await playwright.chromium.launch({ headless: true });
    }

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle' });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: pdfMargins,
    });

    const bytes = new Uint8Array(Buffer.from(pdfUint8Array));
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(filename && String(filename).trim()) || "resume"}.pdf"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (err: any) {
    console.error("resume-builder/export/pdf fatal:", err?.stack || err?.message || err);
    return NextResponse.json({ ok: false, error: "Failed to export PDF." }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
