// /api/export/templates-server.ts

import { TailorTemplateId } from "@/app/app/upload-tailor/types";

// ========== SHARED HELPERS ==========

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

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

// Classic single-column HTML renderer
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

// Two-column helpers
function extractTopHeader(md: string) {
  const lines = md.split(/\r?\n/);
  let nameLine = "";
  let titleLine = "";
  let contactLine = "";

  const h1Index = lines.findIndex((l) => l.trim().startsWith("# "));
  if (h1Index >= 0) {
    nameLine = lines[h1Index].trim().replace(/^#\s+/, "").trim();
    titleLine = (lines[h1Index + 1] || "").trim();
    contactLine = (lines[h1Index + 2] || "").trim();
  }

  const startRest = h1Index >= 0 ? h1Index + 3 : 0;
  const rest = lines.slice(startRest).join("\n").trim();

  return { nameLine, titleLine, contactLine, rest };
}

function splitByH2(md: string) {
  const lines = md.split(/\r?\n/);
  const sections: { title: string; content: string }[] = [];

  let currentTitle = "";
  let buf: string[] = [];

  const push = () => {
    if (!currentTitle) return;
    sections.push({ title: currentTitle, content: buf.join("\n").trim() });
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      push();
      currentTitle = line.slice(3).trim();
      buf = [];
    } else {
      buf.push(raw);
    }
  }
  push();

  return sections;
}

function splitContact(contactLine: string) {
  return (contactLine || "")
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Two-column renderer
function mdToTwoColumnHtml(md: string) {
  const { nameLine, titleLine, contactLine, rest } = extractTopHeader(md);
  const contactParts = splitContact(contactLine);
  const sections = splitByH2(rest);

  const contactHtml = contactParts
    .map((p) => {
      const isAccent = /@/.test(p) || /\+?\d/.test(p);
      return `<div class="${isAccent ? "accent" : ""}">${esc(p)}</div>`;
    })
    .join("");

  const sectionsHtml = sections
    .map(
      (sec) => `
      <div class="sec-left">
        <div class="leftbar"></div>
        <div class="sec-title">${esc(sec.title)}</div>
      </div>
      <div class="sec-right">
        <div class="rightline"></div>
        <div class="sec-content">
          ${mdToHtml(sec.content)}
        </div>
      </div>
    `
    )
    .join("");

  return `
    <div class="two-col-page">
      <div class="two-col-grid">
        <div class="top-left">
          ${nameLine ? `<div class="name-left">${esc(nameLine)}</div>` : ""}
          ${titleLine ? `<div class="title-left">${esc(titleLine)}</div>` : ""}
        </div>

        <div class="top-right">
          <div class="topline"></div>
          ${nameLine ? `<div class="name-right">${esc(nameLine)}</div>` : ""}
          <div class="contact">${contactHtml}</div>
        </div>

        ${sectionsHtml}
      </div>
    </div>
  `;
}

// ========== TEMPLATE TYPE + REGISTRY ==========

type ServerTemplate = {
  id: TailorTemplateId;
  css: string;
  bodyClass?: string;
  render: (markdown: string) => string; // ✅ ADD THIS
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
      .cover-letter p { margin: 8pt 0; line-height: 1.7; }
      .cover-letter h1 { font-size: 20pt; margin-bottom: 12pt; }
      .cover-letter h2 { font-size: 16pt; margin: 14pt 0 10pt 0; }
    `,
    render: mdToHtml, // ✅ classic uses simple single-column
  },
  twoColumn: {
    id: 'twoColumn',
    css: `
       @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }

    body {
      font-family: Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45; /* tighter */
      color: #111;
      margin: 0;
      padding: 0;
    }

    a { color: #1155cc; text-decoration: underline; }

    .two-col-grid {
      display: grid;
      grid-template-columns: 240px 1fr; /* narrower left column */
      column-gap: 32px;                /* smaller gap */
      padding: 16px 12px;              /* small padding around content */
    }

    .top-left, .top-right {
      padding-top: 10px; /* down from 18px */
    }

    .name-left {
      font-size: 40px;   /* down from 46px */
      font-weight: 800;
      line-height: 1.02;
      margin: 0;
    }

    .title-left {
      margin-top: 8px;
      font-size: 22px;   /* down from 26px */
      font-weight: 700;
      color: #f97316;
      line-height: 1.1;
    }

    .topline {
      border-top: 3px solid rgba(17,17,17,0.70);
      margin: 0 0 8px 0;
    }

    .name-right {
      font-size: 16px; /* smaller */
      font-weight: 700;
      margin: 0;
    }

    .contact {
      margin-top: 4px;
      font-size: 10px;
      color: #666;
    }

    .contact .accent { color: #f97316; }

    .sec-left {
      padding-top: 12px;
    }

    .sec-right {
      padding-top: 8px;
    }

    .leftbar {
      height: 2px;
      width: 40px;
      background: rgba(17,17,17,0.70);
      margin-bottom: 6px;
    }

    .sec-title {
      font-size: 14px;
      font-weight: 800;
      margin: 0;
    }

    .rightline {
      border-top: 2px solid rgba(17,17,17,0.70);
      margin: 0 0 6px 0;
    }

    .sec-content p {
      margin: 0 0 6px 0;
      font-size: 10.5pt;
      line-height: 1.45;
      color: rgba(17,17,17,0.92);
    }

    .sec-content ul {
      margin: 0 0 8px 16px;
      padding: 0;
      list-style-type: disc;
    }

    .sec-content li {
      margin: 0 0 4px 0;
      font-size: 10.5pt;
      line-height: 1.45;
      color: rgba(17,17,17,0.92);
    }

    .sec-content strong { font-weight: 800; color: #111; }
    .sec-content em { font-style: italic; color: rgba(17,17,17,0.8); }

    /* IMPORTANT: allow sections to break across pages */
    .sec-left,
    .sec-right {
      /* removed break-inside / page-break-inside here */
    }

    /* Still avoid breaking inside a single bullet or paragraph line,
       but let the section as a whole split so we don't get huge gaps */
    .sec-content p,
    .sec-content li {
      page-break-inside: avoid;
    }`,
    bodyClass: 'two-column',
    render: mdToTwoColumnHtml, // ✅ twoColumn uses custom grid layout
  },
};
