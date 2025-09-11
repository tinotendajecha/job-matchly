import { NextResponse } from "next/server";
import path from "path";
import { StructuredOutputParser } from "langchain/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { ResumeSchema } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const form = await req.formData();
        const file = form.get("file") as File | null;
        if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
        if (file.size > 5_000_000) {
            return NextResponse.json({ ok: false, error: "File too large (5MB max)" }, { status: 400 });
        }

        const ext = path.extname(file.name).toLowerCase();
        let text = "";

        // --- DOCX/TXT only for now ---
        if (ext === ".docx") {
            const mammoth = await import("mammoth");
            const buf = Buffer.from(await file.arrayBuffer());
            const { value } = await mammoth.extractRawText({ buffer: buf });
            text = (value || "").trim();
        } else if (ext === ".txt") {
            text = (await file.text()).toString().trim();
        } else {
            return NextResponse.json(
                { ok: false, error: "Unsupported file type for MVP. Please upload a .docx (or .txt)." },
                { status: 415 }
            );
        }

        if (!text) {
            return NextResponse.json(
                { ok: false, error: "No extractable text found in the file." },
                { status: 422 }
            );
        }

        // ---- LLM structured extraction (no temperature -> fixes 400) ----
        const llm = new ChatOpenAI({ model: "gpt-5" });
        const parser = StructuredOutputParser.fromZodSchema(ResumeSchema);

        const system = `Extract the resume into the JSON schema below.
                        - Do not invent employers, titles, dates, or skills.
                        ${parser.getFormatInstructions()}`;

        const user = `Resume text:
            """${text.slice(0, 15000)}"""`;

        let structured: any;
        try {
            // Primary path: OpenAI Structured Outputs
            structured = await llm.withStructuredOutput(ResumeSchema).invoke([
                { role: "system", content: system },
                { role: "user", content: user },
            ]);
        } catch (e: any) {
            // Fallback: plain JSON output + schema validate
            console.warn("Structured output failed, falling back. Reason:", e?.message || e);
            const resp = await llm.invoke([
                { role: "system", content: system },
                { role: "user", content: user },
            ]);
            const raw = String(resp.content || "{}");
            structured = ResumeSchema.parse(JSON.parse(raw));
        }

        return NextResponse.json({ ok: true, resumeText: text, resumeJson: structured });
    } catch (err: any) {
        console.error("parse-resume fatal:", err?.message || err);
        // Always return JSON so the client can read it safely
        return NextResponse.json(
            { ok: false, error: "Server error while parsing. Please try another DOCX." },
            { status: 500 }
        );
    }
}
