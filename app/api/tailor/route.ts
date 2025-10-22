// app/api/tailor/route.ts
import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { getCurrentUser } from "@/lib/auth";        // <- custom auth (session cookie)
import { spendCredits } from "@/lib/credits";       // <- 1 credit per tailor
import { prisma } from "@/lib/prisma";
import { safeFileName } from "@/lib/files";
import { extractCompanyAndRoleLC } from "@/lib/extract";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // --- Auth + verification ---
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });
    }

    const { resumeJson, resumeText, jdText, tone = "professional", seniority = "junior", company = "", role = "" } =
      await req.json();

    if (!resumeText || !jdText) {
      return NextResponse.json({ ok: false, error: "Missing inputs" }, { status: 400 });
    }

    // If frontend didn't provide company/role, infer from JD
    let finalCompany = company;
    let finalRole = role;
    if (!company || !role) {
      try {
        const inferred = await extractCompanyAndRoleLC(jdText);
        finalCompany = company || inferred.company || "";
        finalRole = role || inferred.role || "";
      } catch {
        // best-effort; proceed with blanks if extractor fails
      }
    }

    // --- Charge 1 credit (tailor = 1) ---
    try {
      await spendCredits(user.id, 1);
    } catch (e: any) {
      if (e?.message === "INSUFFICIENT_CREDITS") {
        return NextResponse.json({ ok: false, error: "Insufficient credits" }, { status: 402 });
      }
      throw e;
    }

    // --- LLM call (unchanged) ---
    const llm = new ChatOpenAI({ model: "gpt-5" });

    const prompt = [
      {
        role: "system",
        content: `Tailor the resume to the JD.

Rules:
- Never invent employers, titles, or dates.
- Bullets are one line, start with strong verbs; quantify where possible.
- Add JD keywords only if plausible from the resume content.
- Tone: ${tone}; Seniority: ${seniority}.
- Keep content ATS-safe (single column, no tables).

Header rules:
- First line: "# Full Name".
- Second line: contact: "Location · Phone · Email".

Experience formatting (IMPORTANT):
- For EACH role, put a single job header line (NOT a bullet) using:
  **Role** — Company, Location (Start – End)
- Then 3–6 bullet points for achievements.

For Summary, you can add 1-2 lines about the JD, showing motivation for the job and also including the company name so they can see you put your time for tailoring for the job.

Make sure to add projects the user have done before in their dedicated section Projects, if they are relevant to the JD. You can extract these from the resume they upload, but also do not invent any projects. If the resume JSON has a "projects" section, you can use that as a base to add more projects if needed. Also this depends on the type of profession of the user and if projects are relevant for that profession.

Sections & order:
## Professional Summary
## Skills
## Experience
## Education
## Projects (only if present)
## References (only if present; include the names, where they are from and a single-line contact)

At the END include a section "## Changes Summary" with 3–8 bullets describing edits (for on-screen review only; will be stripped before export).
Return the resume as Markdown exactly in that order.`,
      },
      {
        role: "user",
        content: `JOB DESCRIPTION:
"""${String(jdText).slice(0, 9000)}"""

RESUME JSON:
${JSON.stringify(resumeJson ?? {}).slice(0, 9000)}

RESUME TEXT:
"""${String(resumeText).slice(0, 9000)}"""`,
      },
    ];

    const out = await llm.invoke(prompt as any);
    const tailoredMarkdown = String(out.content || "");

    // Generate better document title using LLM
    const titlePrompt = `Generate a professional document title for a resume.
User: ${user.name || "User"}
Company: ${finalCompany || "Company"}
Role: ${finalRole || "Position"}

Format: [USER_NAME]_RESUME_FOR_[COMPANY_NAME]
Example: John_Smith_RESUME_FOR_Google

Return only the title, no other text.`;
    
    const titleResponse = await llm.invoke([{ role: "user", content: titlePrompt }]);
    const generatedTitle = String(titleResponse.content || "").trim();
    
    const title = generatedTitle || `${(user.name || "User").replace(/\s+/g, "_")}_RESUME_FOR_${(finalCompany || "Company").replace(/\s+/g, "_")}`;
    const fileStem = safeFileName(title);

    // Save to DOCUMENT table
    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        kind: "TAILORED_RESUME",
        title,
        markdown: tailoredMarkdown,
        sections: {},
        sourceMeta: { company: finalCompany, role: finalRole, fileStem },
      },
      select: { id: true, title: true },
    });

    // Ledger entry
    await prisma.ledger.create({
      data: {
        userId: user.id,
        type: "RESUME_GENERATED",
        credits: -1,
        meta: { documentId: doc.id, company: finalCompany, role: finalRole, title },
      },
    });

    return NextResponse.json({ ok: true, tailoredMarkdown, documentId: doc.id, title });
  } catch (err: any) {
    console.error("tailor fatal:", err?.message || err);
    return NextResponse.json({ ok: false, error: "Server error while tailoring." }, { status: 500 });
  }
}
