// app/api/resume-builder/export/docx/route.ts
import { NextResponse } from "next/server";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export const runtime = "nodejs";

// Get template-specific CSS
function getTemplateStyles(template: 'classic' | 'modern' = 'classic'): string {
  if (template === 'modern') {
    return `
    body {
      font-family: Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #111;
    }
    .section {
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 8pt;
      color: #2563eb;
    }
    h2 {
      font-size: 14pt;
      font-weight: 600;
      margin: 16pt 0 8pt 0;
      padding-bottom: 2pt;
      border-bottom: 2px solid #2563eb;
      color: #2563eb;
    }
    h3 {
      font-size: 12pt;
      font-weight: 600;
      margin-bottom: 6pt;
      color: #1f2937;
    }
    p {
      margin: 6pt 0;
      font-size: 11pt;
      line-height: 1.6;
      color: #374151;
    }
    ul {
      margin: 6pt 0 8pt 18pt;
      padding: 0;
    }
    li {
      margin: 4pt 0;
      font-size: 11pt;
      line-height: 1.5;
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
      margin-bottom: 12pt;
    }
    `;
  }
  
  // Classic template (default)
  return `
    body {
      font-family: Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #111;
    }
    .section {
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 8pt;
      color: #0f2a43;
    }
    h2 {
      font-size: 14pt;
      font-weight: 600;
      margin: 16pt 0 8pt 0;
      padding-bottom: 2pt;
      border-bottom: 1px solid #dcdcdc;
      color: #12467F;
    }
    h3 {
      font-size: 12pt;
      font-weight: 600;
      margin-bottom: 6pt;
      color: #1f2937;
    }
    p {
      margin: 6pt 0;
      font-size: 11pt;
      line-height: 1.6;
      color: #374151;
    }
    ul {
      margin: 6pt 0 8pt 18pt;
      padding: 0;
    }
    li {
      margin: 4pt 0;
      font-size: 11pt;
      line-height: 1.5;
      color: #374151;
    }
    a {
      color: #1155cc;
      text-decoration: none;
    }
    .header-section {
      border-bottom: 1px solid #dcdcdc;
    }
    .experience-item,
    .education-item,
    .project-item,
    .certification-item,
    .reference-item {
      margin-bottom: 12pt;
    }
  `;
}

export async function POST(req: Request) {
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

    // Generate DOCX
    const mod = require("html-docx-js");
    const api: any = mod?.default ?? mod;
    let buf: Buffer | null = null;

    try {
      if (typeof api.asBuffer === "function") {
        buf = api.asBuffer(fullHtml);
      } else if (typeof api.asBlob === "function") {
        const blob: Blob = api.asBlob(fullHtml);
        buf = Buffer.from(await blob.arrayBuffer());
      } else if (typeof api.asBase64 === "function") {
        buf = Buffer.from(api.asBase64(fullHtml), "base64");
      }
    } catch (e) {
      console.error("html-docx-js failed:", (e as any)?.message || e);
      return NextResponse.json({ ok: false, error: "DOCX generator error." }, { status: 500 });
    }

    if (!buf || buf.length < 50) {
      return NextResponse.json({ ok: false, error: "Generated DOCX was empty." }, { status: 500 });
    }

    const bytes = new Uint8Array(buf);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${(filename && String(filename).trim()) || "resume.docx"}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (err: any) {
    console.error("resume-builder/export/docx fatal:", err?.stack || err?.message || err);
    return NextResponse.json({ ok: false, error: "Failed to export DOCX." }, { status: 500 });
  }
}

