// app/api/export/pdf/route.ts
import { NextResponse } from "next/server";
import playwright from "playwright"; // Import full playwright for local development
import playwrightCore from "playwright-core"; // Import core for serverless
import chromiumServerless from "@sparticuz/chromium";

export const runtime = "nodejs";

// Robustly remove just the "## Changes Summary" section
function stripChangesSummary(md: string) {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let skipping = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const trimmed = l.trim();

    // Start skipping at exact "## Changes Summary"
    if (!skipping && /^##\s*Changes\s+Summary\s*$/i.test(trimmed)) {
      skipping = true;
      continue;
    }

    // Stop skipping when the next H2 begins
    if (skipping && /^##\s+/.test(trimmed)) {
      skipping = false;
      out.push(l);
      continue;
    }

    if (!skipping) out.push(l);
  }

  return out.join("\n");
}

// Escapes
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// Inline renderer with links + bare URLs
function renderInline(raw: string) {
  const linkMd = /\[([^\]\n]{1,100})\]\((https?:\/\/[^\s)]+)\)/g;
  const urlBare = /(https?:\/\/[^\s)]+)(?![^<]*>)/g;

  let idx = 0, parts: string[] = [];
  let match: RegExpExecArray | null;
  const placeholders: string[] = [];

  while ((match = linkMd.exec(raw))) {
    const [all, label, url] = match;
    parts.push(esc(raw.slice(idx, match.index)));
    const anchor = `<a href="${escAttr(url)}">${esc(label)}</a>`;
    const placeholder = `__A${placeholders.length}__`;
    placeholders.push(anchor);
    parts.push(placeholder);
    idx = match.index + all.length;
  }
  parts.push(esc(raw.slice(idx)));

  let joined = parts.join("");
  joined = joined.replace(urlBare, (_m, url) => `<a href="${escAttr(url)}">${esc(url)}</a>`);
  placeholders.forEach((a, i) => { joined = joined.replace(`__A${i}__`, a); });
  return joined;
}

function mdToHtml(md: string) {
  const lines = md.split(/\r?\n/);
  let html = "";
  let inList = false;
  let inExp = false;

  const flushList = () => { if (inList) { html += "</ul>"; inList = false; } };
  const closeExp = () => { if (inExp) { html += "</section>"; inExp = false; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushList(); html += "<p></p>"; continue; }

    if (line.startsWith("# ")) {
      flushList(); closeExp();
      html += `<h1>${renderInline(line.slice(2))}</h1>`;
      continue;
    }

    if (line.startsWith("## ")) {
      flushList(); closeExp();
      const text = line.slice(3).trim();
      const isExp = /^experience$/i.test(text);
      if (isExp) {
        html += `<h2 class="exp">${renderInline(text)}</h2><section class="exp">`;
        inExp = true;
      } else {
        html += `<h2>${renderInline(text)}</h2>`;
      }
      continue;
    }

    if (line.startsWith("- "))  {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${renderInline(line.slice(2))}</li>`;
      continue;
    }

    if (inExp) {
      const m = line.match(/^\*\*([^*]+)\*\*\s*[–—-]\s*(.+)$/);
      if (m) {
        html += `<p class="jobline"><strong>${esc(m[1])}</strong> — ${renderInline(m[2])}</p>`;
        continue;
      }
    }

    html += `<p>${renderInline(line)}</p>`;
  }

  flushList(); closeExp();
  return html;
}

const CSS = `
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.35; color: #111; }
  h1 { font-size: 24pt; letter-spacing: 0.3pt; margin: 0 0 6pt 0; color: #0f2a43; }
  h2 { font-size: 14pt; margin: 12pt 0 6pt 0; padding-bottom: 2pt; border-bottom: 1px solid #dcdcdc; color: #12467F; }
  h2.exp { font-size: 15pt; color: #0e6ba8; }
  section.exp p.jobline { margin: 6pt 0 4pt 0; font-size: 12pt; }
  section.exp p.jobline strong { color: #0e6ba8; font-weight: 700; }
  p { margin: 3pt 0; }
  ul { margin: 3pt 0 6pt 18pt; padding: 0; }
  li { margin: 2pt 0; }
  a { color: #1155cc; text-decoration: none; }
  h1 + p { color: #333; margin-top: 2pt; }
`;


export async function POST(req: Request) {
  let browser = null;
  try {
    const { markdown, filename } = await req.json();

    // ... (Your existing markdown processing and HTML generation logic) ...
    if (!markdown || typeof markdown !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'markdown'." }, { status: 400 });
    }

    const safeMd = markdown.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    let cleaned = stripChangesSummary(safeMd).trim();

    if (!/\S/.test(cleaned)) {
      return NextResponse.json(
        { ok: false, error: "Nothing to export (main content missing)." },
        { status: 422 }
      );
    }

    if (!/^#\s+/m.test(cleaned)) {
      cleaned = `# Resume\n\n${cleaned}`;
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${mdToHtml(cleaned)}</body></html>`;

    // ** CONDITIONAL PLAYWRIGHT LOGIC **
    if (process.env.VERCEL) {
      // Logic for Vercel/serverless
      const executablePath = await chromiumServerless.executablePath();
      browser = await playwrightCore.chromium.launch({
        args: chromiumServerless.args,
        executablePath: executablePath,
        headless: true,
      });
    } else {
      // Logic for local development
      browser = await playwright.chromium.launch({
        headless: true,
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
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
    console.error("export/pdf fatal:", err?.stack || err?.message || err);
    return NextResponse.json({ ok: false, error: "Failed to export PDF." }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
