import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { resumeJson, resumeText, jdText, tone = "professional", seniority = "junior" } = await req.json();
    if (!resumeText || !jdText) {
      return NextResponse.json({ ok: false, error: "Missing inputs" }, { status: 400 });
    }

    const llm = new ChatOpenAI({ model: "gpt-5" });

    const prompt = [
      {
        role: "system",
        content: `Tailor the resume to the JD.

Rules:
- Never invent employers, titles, or dates.
- Bullets are one line, start with strong ver
bs; quantify where possible.
- Add JD keywords only if plausible from the resume content.
- Tone: ${tone}; Seniority: ${seniority}.
- Keep content ATS-safe (single column, no tables).

Header rules:
- First line: "# Full Name".
- Second line: contact: "Location · Phone · Email".
- If socialLinks exist (resumeJson.socialLinks), add a third inline line using Markdown links:
  Example: [Portfolio](https://...) | [GitHub](https://...) | [LinkedIn](https://...)
  If a link string includes a label, use it as [Label](URL); if it's a bare URL, infer a short label (GitHub/LinkedIn/Portfolio) from the domain.

  Experience formatting (IMPORTANT):
- For EACH role, put a single job header line (NOT a bullet) using:
  **Role** — Company, Location (Start – End)
- Then 3–6 bullet points for achievements.

Sections & order:
## Professional Summary
## Skills
## Experience
## Education
## Projects (only if present)
## References (only if present; include the names and a single-line contact)

At the END include a section "## Changes Summary" with 3–8 bullets describing edits (for on-screen review only; will be stripped before export).
Return the resume as Markdown exactly in that order.`,
      },
      {
        role: "user",
        content:
`JOB DESCRIPTION:
"""${jdText.slice(0, 9000)}"""

RESUME JSON:
${JSON.stringify(resumeJson ?? {}).slice(0, 9000)}

RESUME TEXT:
"""${String(resumeText).slice(0, 9000)}"""`,
      },
    ];

    const out = await llm.invoke(prompt);
    const tailoredMarkdown = String(out.content || "");

    return NextResponse.json({ ok: true, tailoredMarkdown });
  } catch (err: any) {
    console.error("tailor fatal:", err?.message || err);
    return NextResponse.json({ ok: false, error: "Server error while tailoring." }, { status: 500 });
  }
}
