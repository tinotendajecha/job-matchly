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
  if (!user)
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  if (!user.emailVerified)
    return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });

  let { resumeText, jdText, company = "", role = "" } = await req.json();
  if (!resumeText || !jdText)
    return NextResponse.json({ ok: false, error: "Missing inputs" }, { status: 400 });

  // If frontend didn't provide company/role, infer from JD
  if (!company || !role) {
    try {
      const inferred = await extractCompanyAndRoleLC(jdText);
      company = company || inferred.company || "";
      role = role || inferred.role || "";
    } catch {
      // best-effort fallback
    }
  }

  // Charge 1 credit
  try {
    await spendCredits(user.id, 1);
  } catch {
    return NextResponse.json({ ok: false, error: "Insufficient credits" }, { status: 402 });
  }

  try {
    const llm = new ChatOpenAI({ model: "gpt-5"});

    // --- Generate Cover Letter ---
    const out = await llm.invoke([
      {
        role: "system",
        content: `Write a concise, professional cover letter (250–350 words).
- 3–4 short paragraphs plus a closing.
- Confident, warm tone.
- Tailor to the role and company using 2–3 relevant JD keywords.
- Include one brief STAR example with a measurable result.
- End with a polite call to action (request conversation/interview).
- No tables, images, or personal data fabrication.`,
      },
      {
        role: "user",
        content: `ROLE: ${role || "—"}
COMPANY: ${company || "—"}

JOB DESCRIPTION:
"""${String(jdText).slice(0, 9000)}"""

RESUME:
"""${String(resumeText).slice(0, 9000)}"""`,
      },
    ] as any);

    const markdown = String(out.content || "").trim();

    // --- Generate Document Title ---
    const titlePrompt = `
Generate a clean, professional title for a cover letter.
Prefer natural capitalization (no underscores).
Examples:
- Cover Letter for John Smith
- Cover Letter for a Product Designer at Meta
- Cover Letter for a Software Engineer
- Cover Letter

Use the user's name, role, and company if available.

User Name: ${user.name || "User"}
Role: ${role || ""}
Company: ${company || ""}
`;

    const titleResponse = await llm.invoke([{ role: "user", content: titlePrompt }]);
    let generatedTitle = String(titleResponse.content || "").trim();

    // Fallback if LLM returns blank or messy text
    if (!generatedTitle || generatedTitle.length < 5) {
      if (role && company) {
        generatedTitle = `Cover Letter for a ${role} at ${company}`;
      } else if (role) {
        generatedTitle = `Cover Letter for a ${role}`;
      } else {
        generatedTitle = `Cover Letter for ${user.name || "User"}`;
      }
    }

    // Clean up extra underscores or unwanted chars
    const title = generatedTitle.replace(/_/g, " ").replace(/\s+/g, " ").trim();
    const fileStem = safeFileName(title);

    // --- Persist document ---
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
    await prisma.ledger
      .create({
        data: {
          userId: user.id,
          type: "COVER_LETTER_GENERATION_FAILED",
          credits: +1,
          meta: { error: String(e?.message || e) },
        },
      })
      .catch(() => {});
    console.error("cover-letter fatal:", e?.message || e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
