// /api/cover-letter/route.ts
import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { getCurrentUser } from "@/lib/auth";
import { spendCredits, refundCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { safeFileName } from "@/lib/files";
import { extractCompanyAndRoleLC } from "@/lib/extract";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  if (!user.emailVerified) return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });

  let { resumeText, jdText, company = "", role = "" } = await req.json();
  if (!resumeText || !jdText) {
    return NextResponse.json({ ok: false, error: "Missing inputs" }, { status: 400 });
  }

  // If frontend didn't provide company/role, infer from JD
  if (!company || !role) {
    try {
      const inferred = await extractCompanyAndRoleLC(jdText);
      company = company || inferred.company || "";
      role    = role    || inferred.role    || "";
    } catch {
      // best-effort; proceed with blanks if extractor fails
    }
  }

  // Charge 1 credit
  try { await spendCredits(user.id, 1); }
  catch { return NextResponse.json({ ok: false, error: "Insufficient credits" }, { status: 402 }); }

  try {
    // Prompt with CTA + STAR
    const llm = new ChatOpenAI({ model: "gpt-5" });
    const out = await llm.invoke([
      {
        role: "system",
        content:
`Write a concise, professional cover letter (250–350 words).
- 3–4 short paragraphs plus a closing
- Confident, warm tone
- Tailor to the role and company using 2–3 relevant JD keywords
- Include one brief STAR example with a measurable result
- End with a polite, specific call to action (request conversation/interview)
- No tables, images, or personal data fabrication`,
      },
      {
        role: "user",
        content:
`ROLE: ${role || "—"}
COMPANY: ${company || "—"}

JOB DESCRIPTION:
"""${String(jdText).slice(0, 9000)}"""

RESUME:
"""${String(resumeText).slice(0, 9000)}"""`,
      },
    ] as any);

    const markdown = String(out.content || "").trim();

    // Generate better document title using LLM
    const titlePrompt = `Generate a professional document title for a cover letter.
User: ${user.name || "User"}
Company: ${company || "Company"}
Role: ${role || "Position"}

Format: Cover_Letter_For_[USER_NAME]
Example: Cover_Letter_For_John_Smith

Return only the title, no other text.`;
    
    const titleResponse = await llm.invoke([{ role: "user", content: titlePrompt }]);
    const generatedTitle = String(titleResponse.content || "").trim();
    
    const title = generatedTitle || `Cover_Letter_For_${(user.name || "User").replace(/\s+/g, "_")}`;
    const fileStem = safeFileName(title);

    // Persist
    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        kind: "COVER_LETTER",
        title,
        markdown,
        sections: {},
        sourceMeta: { company, role, fileStem },
      },
      select: { id: true, title: true },
    });

    // Ledger entry
    await prisma.ledger.create({
      data: {
        userId: user.id,
        type: "COVER_LETTER_GENERATED",
        credits: -1,
        meta: { documentId: doc.id, company, role, title },
      },
    });

    return NextResponse.json({ ok: true, id: doc.id, markdown, title, fileStem });
  } catch (e: any) {
    // Refund on failure + ledger note
    await refundCredits(user.id, 1).catch(() => {});
    await prisma.ledger.create({
      data: {
        userId: user.id,
        type: "COVER_LETTER_GENERATION_FAILED",
        credits: +1,
        meta: { error: String(e?.message || e) },
      },
    }).catch(() => {});
    console.error("cover-letter fatal:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
