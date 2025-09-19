import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";


function bag(s: string) {
    return new Set(
        s
            .toLowerCase()
            .replace(/[^a-z0-9\s+]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 2)
    );
}


export async function POST(req: Request) {
    const { resumeText, jdText } = await req.json();
    if (!resumeText || !jdText)
        return NextResponse.json({ ok: false, error: "Missing inputs" }, { status: 400 });


    const a = bag(resumeText);
    const b = bag(jdText);
    const inter = new Set([...a].filter((x) => b.has(x)));
    const union = new Set([...a, ...b]);
    const keywordOverlapScore = inter.size / Math.max(1, union.size);


    const llm = new ChatOpenAI({ model: "gpt-5-mini" });
    const prompt = [
        { role: "system", content: "You rate resume-to-job fit 0..100. Be strict; do not fabricate." },
        {
            role: "user",
            content: `Job Description:\n"""${jdText.slice(0, 8000)}"""\nResume:\n"""${resumeText.slice(0, 8000)}"""\nReturn JSON: {"score": number, "missing_keywords": string[], "notes": string[]}`,
        },
    ];
    const out = await llm.invoke(prompt);
    const parsed = JSON.parse(String(out.content));


    return NextResponse.json({
        ok: true,
        keywordOverlapScore,
        llmFitScore: parsed.score,
        matchedKeywords: [...inter].slice(0, 50),
        missingKeywords: parsed.missing_keywords,
        notes: parsed.notes,
    });
}