// app/api/export/pdf/route.ts
import { NextResponse } from "next/server";
import playwright from "playwright";
import playwrightCore from "playwright-core";
import chromium from "@sparticuz/chromium";
import { SERVER_TEMPLATES } from "../templates-server";
import { TailorTemplateId } from "@/app/app/upload-tailor/types";

export const runtime = "nodejs";

type ExportPdfBody = {
  markdown: string;
  filename?: string;
  templateId?: TailorTemplateId;
}

// Robustly remove just the "## Changes Summary" section
function stripChangesSummary(md: string) {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let skipping = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const trimmed = l.trim();

    if (!skipping && /^##\s*Changes\s+Summary\s*$/i.test(trimmed)) {
      skipping = true;
      continue;
    }

    if (skipping && /^##\s+/.test(trimmed)) {
      skipping = false;
      out.push(l);
      continue;
    }

    if (!skipping) out.push(l);
  }

  return out.join("\n");
}

// ❌ REMOVED: esc, escAttr, renderInline, mdToHtml
// These are now in templates-server.ts

export async function POST(req: Request) {
  let browser = null;
  try {
    const body = (await req.json()) as ExportPdfBody;

    const templateId: TailorTemplateId = body.templateId ?? 'classic';
    const templateChosen = SERVER_TEMPLATES[templateId];

    // ❌ REMOVED: const CSS = templateChosen.css (not needed separately anymore)

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

    const isCoverLetter = /^(dear|to whom it may concern|hiring manager)/i.test(cleaned.trim()) ||
                          /cover\s+letter/i.test(cleaned) ||
                          /application\s+for/i.test(cleaned);

    if (!/^#\s+/m.test(cleaned)) {
      const titleFromFilename = (fn?: string) => {
        if (!fn) return "";
        const base = String(fn).replace(/\.[a-zA-Z0-9]+$/, "");
        return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
      };
      const fallback = isCoverLetter ? "Cover Letter" : "Resume";
      const derived = titleFromFilename(body.filename) || fallback;
      cleaned = `# ${derived}\n\n${cleaned}`;
    }

    // ✅ UPDATED: Use template's render function
    const bodyInnerHtml = isCoverLetter
      ? SERVER_TEMPLATES.classic.render(cleaned)  // Cover letters always use classic
      : templateChosen.render(cleaned);           // Otherwise use selected template

    const bodyClassParts = [];
    if (isCoverLetter) bodyClassParts.push('cover-letter');
    if (templateChosen.bodyClass) bodyClassParts.push(templateChosen.bodyClass);
    const bodyClassAttr = bodyClassParts.join(' ');

    // ✅ UPDATED: Use templateChosen.css and bodyInnerHtml
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${templateChosen.css}</style></head><body class="${bodyClassAttr}">${bodyInnerHtml}</body></html>`;

    // ** CONDITIONAL PLAYWRIGHT LOGIC **
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
    await page.setContent(html, { waitUntil: 'networkidle' });

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

    const pdfBuffer = Buffer.from(pdfUint8Array);
    const bytes = new Uint8Array(pdfBuffer);

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(body.filename && String(body.filename).trim()) || "resume.pdf"}"`,
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
