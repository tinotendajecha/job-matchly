import { NextResponse } from "next/server";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export const runtime = "nodejs"; // keep Node runtime

// Remove "## Changes Summary" section (keep it for UI only)
function stripChangesSummary(md: string) {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let skipping = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!skipping && /^##\s*Changes\s+Summary\s*$/i.test(l.trim())) { skipping = true; continue; }
    if (skipping) { if (/^##\s+/.test(l)) { skipping = false; out.push(l); } continue; }
    out.push(l);
  }
  return out.join("\n");
}

// escape HTML (we'll insert <a> tags via renderInline)
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// Render inline content with support for [label](url) and bare URLs
function renderInline(raw: string) {
  const linkMd = /\[([^\]\n]{1,100})\]\((https?:\/\/[^\s)]+)\)/g;
  const urlBare = /(https?:\/\/[^\s)]+)(?![^<]*>)/g;

  // First replace Markdown links with placeholders to avoid escaping their tags
  let idx = 0, parts: Array<string> = [];
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

  // Join, then auto-link bare URLs in the escaped text (won't touch placeholders)
  let joined = parts.join("");
  joined = joined.replace(urlBare, (_m, url) => `<a href="${escAttr(url)}">${esc(url)}</a>`);

  // Swap placeholders back to real anchors
  placeholders.forEach((a, i) => { joined = joined.replace(`__A${i}__`, a); });
  return joined;
}

// Markdown -> HTML with hierarchy
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

    // H1
    if (line.startsWith("# ")) {
      flushList(); closeExp();
      html += `<h1>${renderInline(line.slice(2))}</h1>`;
      continue;
    }

    // H2
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

    // Bullets
    if (line.startsWith("- "))  {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${renderInline(line.slice(2))}</li>`;
      continue;
    }

    // Paragraphs (detect job header lines inside Experience)
    if (inExp) {
      // **Role** — Company, Location (Dates...)
      const m = line.match(/^\*\*([^*]+)\*\*\s*[–—-]\s*(.+)$/);
      if (m) {
        // Keep bolded role, render the RHS with links if any
        html += `<p class="jobline"><strong>${esc(m[1])}</strong> — ${renderInline(m[2])}</p>`;
        continue;
      }
    }

    html += `<p>${renderInline(line)}</p>`;
  }

  flushList(); closeExp();
  return html;
}


// Typography tuned for Word via altChunk HTML
const CSS = `
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.35; color: #111; }
  /* Full name (top) – +2pt, deep navy */
  h1 {
    font-size: 24pt;
    letter-spacing: 0.3pt;
    margin: 0 0 6pt 0;
    color: #0f2a43;
  }
  /* Section headings – +1pt, dark blue */
  h2 {
    font-size: 14pt;
    margin: 12pt 0 6pt 0;
    padding-bottom: 2pt;
    border-bottom: 1px solid #dcdcdc;
    color: #12467F;
  }
  /* Experience heading – +1pt over other h2, complementary blue */
  h2.exp {
    font-size: 15pt;
    color: #0e6ba8;
  }
  /* Job header line inside Experience */
  section.exp p.jobline {
    margin: 6pt 0 4pt 0;
    font-size: 12pt;
  }
  section.exp p.jobline strong {
    color: #0e6ba8; /* title color */
    font-weight: 700;
  }
  p  { margin: 3pt 0; }
  ul { margin: 3pt 0 6pt 18pt; padding: 0; }
  li { margin: 2pt 0; }
  a  { color: #1155cc; text-decoration: none; }
  h1 + p { color: #333; margin-top: 2pt; }
`;


export async function POST(req: Request) {
  try {
    const { markdown, filename } = await req.json();
    if (!markdown || typeof markdown !== "string") {
      return NextResponse.json({ ok: false, error: "Missing 'markdown'." }, { status: 400 });
    }

    const cleaned = stripChangesSummary(markdown);
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${mdToHtml(cleaned)}</body></html>`;

    // ✅ static, traceable require left for runtime (because we externalized it)
    const mod = require("html-docx-js");
    const api: any = mod?.default ?? mod;

    let buf: Buffer | null = null;

    if (typeof api.asBuffer === "function") {
      // if you move to html-docx-js >= 0.4.x
      buf = api.asBuffer(html);
    } else if (typeof api.asBlob === "function") {
      const blob: Blob = api.asBlob(html); // 0.3.x API
      buf = Buffer.from(await blob.arrayBuffer());
    } else if (typeof api.asBase64 === "function") {
      buf = Buffer.from(api.asBase64(html), "base64");
    } else {
      return NextResponse.json({ ok: false, error: "html-docx-js API not found" }, { status: 500 });
    }

    if (!buf) {
      return NextResponse.json({ ok: false, error: "Failed to generate DOCX buffer." }, { status: 500 });
    }
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${(filename && String(filename).trim()) || "resume.docx"}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("export/docx fatal:", err?.stack || err?.message || err);
    return NextResponse.json({ ok: false, error: "Failed to export DOCX." }, { status: 500 });
  }
}