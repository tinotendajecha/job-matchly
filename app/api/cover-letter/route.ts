import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { getCurrentUser } from "@/lib/auth";
import { spendCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    if (!user.emailVerified) return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });

    const { resumeText, jdText, company = "", role = "" } = await req.json();
    if (!resumeText || !jdText) {
      return NextResponse.json({ ok: false, error: "Missing inputs" }, { status: 400 });
    }

    // 1) charge 1 credit
    try { await spendCredits(user.id, 1); }
    catch { return NextResponse.json({ ok: false, error: "Insufficient credits" }, { status: 402 }); }

    // 2) generate cover letter
    const llm = new ChatOpenAI({ model: "gpt-5" });
    const out = await llm.invoke([
      { role: "system", content:
`Write a concise, professional cover letter (350–450 words).
- Confident, warm tone
- 4–5 short paragraphs
- Tie resume strengths to JD requirements
- Include role & company if provided
- No tables or images
- End with a polite call to action` },
      { role: "user", content:
`ROLE: ${role}
COMPANY: ${company}

JOB DESCRIPTION:
"""${String(jdText).slice(0, 9000)}"""

RESUME:
"""${String(resumeText).slice(0, 9000)}"""` },
    ] as any);

    const markdown = String(out.content || "").trim();

    // 3) store as a document (COVER_LETTER)
    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        kind: "COVER_LETTER",
        title: role ? `Cover Letter - ${role}` : "Cover Letter",
        markdown,
        sections: {},
        sourceMeta: { company, role },
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: doc.id, markdown });
  } catch (e: any) {
    console.error("cover-letter fatal:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
