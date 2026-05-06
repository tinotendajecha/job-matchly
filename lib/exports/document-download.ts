import { NextResponse } from "next/server";
import { createRequire } from "module";
import playwright from "playwright";
import playwrightCore from "playwright-core";
import chromium from "@sparticuz/chromium";
import { SERVER_TEMPLATES } from "@/app/api/export/templates-server";
import { TailorTemplateId } from "@/app/app/upload-tailor/types";

const require = createRequire(import.meta.url);

export type ExportPdfBody = {
  markdown: string;
  filename?: string;
  templateId?: TailorTemplateId;
};

export type ExportDocxBody = {
  markdown: string;
  filename?: string;
  templateId?: string;
};

function stripChangesSummary(md: string) {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let skipping = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!skipping && /^##\s*Changes\s+Summary\s*$/i.test(trimmed)) {
      skipping = true;
      continue;
    }

    if (skipping && /^##\s+/.test(trimmed)) {
      skipping = false;
      out.push(line);
      continue;
    }

    if (!skipping) out.push(line);
  }

  return out.join("\n");
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function renderInline(raw: string) {
  const linkMd = /\[([^\]\n]{1,100})\]\((https?:\/\/[^\s)]+)\)/g;
  const urlBare = /(https?:\/\/[^\s)]+)(?![^<]*>)/g;

  let idx = 0;
  const parts: string[] = [];
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
  placeholders.forEach((anchor, i) => {
    joined = joined.replace(`__A${i}__`, anchor);
  });
  return joined;
}

function mdToHtml(md: string) {
  const lines = md.split(/\r?\n/);
  let html = "";
  let inList = false;
  let inExperience = false;

  const flushList = () => {
    if (inList) {
      html += "</ul>";
      inList = false;
    }
  };

  const closeExperience = () => {
    if (inExperience) {
      html += "</section>";
      inExperience = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushList();
      html += "<p></p>";
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      closeExperience();
      html += `<h1>${renderInline(line.slice(2))}</h1>`;
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      closeExperience();
      const text = line.slice(3).trim();
      const isExperience = /^experience$/i.test(text);

      if (isExperience) {
        html += `<h2 class="exp">${renderInline(text)}</h2><section class="exp">`;
        inExperience = true;
      } else {
        html += `<h2>${renderInline(text)}</h2>`;
      }
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${renderInline(line.slice(2))}</li>`;
      continue;
    }

    if (inExperience) {
      const match = line.match(/^\*\*([^*]+)\*\*\s*[–—-]\s*(.+)$/);
      if (match) {
        html += `<p class="jobline"><strong>${esc(match[1])}</strong> - ${renderInline(match[2])}</p>`;
        continue;
      }
    }

    html += `<p>${renderInline(line)}</p>`;
  }

  flushList();
  closeExperience();
  return html;
}

const DOCX_CSS = `
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
  .cover-letter p { margin: 8pt 0; line-height: 1.7; }
  .cover-letter h1 { font-size: 20pt; margin-bottom: 12pt; }
  .cover-letter h2 { font-size: 16pt; margin: 14pt 0 10pt 0; }
`;

function withDefaultTitle(markdown: string, filename: string | undefined, fallback: string) {
  if (/^#\s+/m.test(markdown)) return markdown;

  const base = filename ? String(filename).replace(/\.[a-zA-Z0-9]+$/, "") : "";
  const derived = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || fallback;
  return `# ${derived}\n\n${markdown}`;
}

function detectCoverLetter(markdown: string) {
  return (
    /^(dear|to whom it may concern|hiring manager)/i.test(markdown.trim()) ||
    /cover\s+letter/i.test(markdown) ||
    /application\s+for/i.test(markdown)
  );
}

export async function buildPdfResponse(body: ExportPdfBody) {
  let browser: Awaited<ReturnType<typeof playwright.chromium.launch>> | Awaited<ReturnType<typeof playwrightCore.chromium.launch>> | null = null;

  try {
    const templateId: TailorTemplateId = body.templateId ?? "classic";
    const templateChosen = SERVER_TEMPLATES[templateId];

    if (!body.markdown || typeof body.markdown !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'markdown'." }, { status: 400 });
    }

    const safeMd = body.markdown.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
    let cleaned = stripChangesSummary(safeMd).trim();

    if (!/\S/.test(cleaned)) {
      return NextResponse.json(
        { ok: false, error: "Nothing to export (main content missing)." },
        { status: 422 }
      );
    }

    const isCoverLetter = detectCoverLetter(cleaned);
    cleaned = withDefaultTitle(cleaned, body.filename, isCoverLetter ? "Cover Letter" : "Resume");

    const bodyInnerHtml = isCoverLetter
      ? SERVER_TEMPLATES.classic.render(cleaned)
      : templateChosen.render(cleaned);

    const bodyClass = [isCoverLetter ? "cover-letter" : null, templateChosen.bodyClass]
      .filter(Boolean)
      .join(" ");

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${templateChosen.css}</style></head><body class="${bodyClass}">${bodyInnerHtml}</body></html>`;

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
    await page.setContent(html, { waitUntil: "networkidle" });

    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0.6cm",
        right: "0.7cm",
        bottom: "0.6cm",
        left: "0.7cm",
      },
    });

    const bytes = new Uint8Array(Buffer.from(pdfUint8Array));
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(body.filename && String(body.filename).trim()) || "resume.pdf"}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (error: any) {
    console.error("export/pdf fatal:", error?.stack || error?.message || error);
    return NextResponse.json({ ok: false, error: "Failed to export PDF." }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function buildDocxResponse(body: ExportDocxBody) {
  try {
    const { markdown, filename } = body;

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

    const isCoverLetter = detectCoverLetter(cleaned);
    cleaned = withDefaultTitle(cleaned, filename, isCoverLetter ? "Cover Letter" : "Resume");

    const bodyClass = isCoverLetter ? "cover-letter" : "";
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${DOCX_CSS}</style></head><body class="${bodyClass}">${mdToHtml(cleaned)}</body></html>`;

    const mod = require("html-docx-js");
    const api: any = mod?.default ?? mod;
    let buf: Buffer | null = null;

    if (typeof api.asBuffer === "function") {
      buf = api.asBuffer(html);
    } else if (typeof api.asBlob === "function") {
      const blob: Blob = api.asBlob(html);
      buf = Buffer.from(await blob.arrayBuffer());
    } else if (typeof api.asBase64 === "function") {
      buf = Buffer.from(api.asBase64(html), "base64");
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
  } catch (error: any) {
    console.error("export/docx fatal:", error?.stack || error?.message || error);
    return NextResponse.json({ ok: false, error: "Failed to export DOCX." }, { status: 500 });
  }
}
