// app/api/parse-resume/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { StructuredOutputParser } from "langchain/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { ResumeSchema } from "@/lib/types";
import { getCurrentUser } from "@/lib/auth";
import { pdfToText } from "pdf-ts"; // PDF extraction

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Normalize raw text from any extractor (PDF/DOCX/TXT) for more consistent LLM input
function normalizeResumeText(raw: string) {
  return (raw || "")
    // join hyphenated line breaks: devel-\noper -> developer
    .replace(/(\w)-\s*\n\s*(\w)/g, "$1$2")
    // keep double newlines as paragraph breaks, collapse single newlines to spaces
    .replace(/\r?\n[ \t]*\r?\n/g, "\n\n")
    .replace(/\r?\n+/g, " ")
    // collapse excess whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function POST(req: Request) {
  try {
    // --- Gate BEFORE any parsing work ---
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });
    }
    if ((user.credits ?? 0) < 1) {
      return NextResponse.json(
        { ok: false, error: "You need at least 1 credit to start tailoring." },
        { status: 402 }
      );
    }

    // --- Read file ---
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });

    const ext = path.extname(file.name || "").toLowerCase();
    const isPdf = ext === ".pdf";

    // PDFs are typically larger; allow up to 10MB for PDF, 5MB for others
    if ((!isPdf && file.size > 5_000_000) || (isPdf && file.size > 10_000_000)) {
      return NextResponse.json(
        { ok: false, error: isPdf ? "PDF too large (10MB max)" : "File too large (5MB max)" },
        { status: 400 }
      );
    }

    let text = "";

    // --- Extract text for each supported type ---
    if (isPdf) {
      try {
        const buf = Buffer.from(await file.arrayBuffer());
        const raw = await pdfToText(buf); // pdf-ts
        text = normalizeResumeText(raw || "");
      } catch (err: any) {
        const msg = String(err?.message || err);
        if (/password|encrypted/i.test(msg)) {
          return NextResponse.json(
            { ok: false, error: "This PDF is password-protected. Please export an unencrypted copy." },
            { status: 422 }
          );
        }
        return NextResponse.json(
          { ok: false, error: "We couldn't read this PDF. Try exporting a searchable PDF or upload DOCX/TXT." },
          { status: 422 }
        );
      }
    } else if (ext === ".docx") {
      const mammoth = await import("mammoth");
      const buf = Buffer.from(await file.arrayBuffer());
      const { value } = await mammoth.extractRawText({ buffer: buf });
      text = normalizeResumeText(value || "");
    } else if (ext === ".txt") {
      const raw = (await file.text()).toString();
      text = normalizeResumeText(raw);
    } else {
      return NextResponse.json(
        { ok: false, error: "Unsupported file type. Please upload a PDF, DOCX, or TXT." },
        { status: 415 }
      );
    }

    if (!text) {
      // Common when the PDF is a scan without OCR text layer
      return NextResponse.json(
        {
          ok: false,
          error:
            "No extractable text found. If this is a scanned PDF, export a searchable PDF (with OCR) or upload a DOCX/TXT.",
        },
        { status: 422 }
      );
    }

    // --- LLM structured extraction ---
    // Use a small context slice to keep request lean (adjust if you like)
    const llm = new ChatOpenAI({ model: "gpt-5-mini" });
    const parser = StructuredOutputParser.fromZodSchema(ResumeSchema);

    const system = `Extract the resume into the JSON schema below.
- Do not invent employers, titles, dates, or skills.
${parser.getFormatInstructions()}`;

    const userMsg = `Resume text:
"""${text.slice(0, 15000)}"""`;

    let structured: any;
    try {
      // Primary: structured outputs
      structured = await llm.withStructuredOutput(ResumeSchema).invoke([
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ]);
    } catch (e: any) {
      // Fallback: plain JSON + validate
      console.warn("Structured output failed, falling back:", e?.message || e);
      const resp = await llm.invoke([
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ]);
      const raw = String(resp.content || "{}");
      structured = ResumeSchema.parse(JSON.parse(raw));
    }

    return NextResponse.json({
      ok: true,
      resumeText: text,
      resumeJson: structured,
    });
  } catch (err: any) {
    console.error("parse-resume fatal:", err?.stack || err?.message || err);
    return NextResponse.json(
      { ok: false, error: "Server error while parsing. Please try another file." },
      { status: 500 }
    );
  }
}
