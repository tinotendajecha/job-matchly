// app/api/tailor/route.ts
import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { getCurrentUser } from "@/lib/auth";
import { spendCredits } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { safeFileName } from "@/lib/files";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    if (!user.emailVerified) return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });

    const { resumeJson, resumeText, jdText, tone = "professional", seniority = "junior" } = await req.json();
    if (!resumeText || !jdText)
      return NextResponse.json({ ok: false, error: "Missing inputs" }, { status: 400 });

    // Spend 1 credit
    try {
      await spendCredits(user.id, 1);
    } catch (e: any) {
      if (e?.message === "INSUFFICIENT_CREDITS") {
        return NextResponse.json({ ok: false, error: "Insufficient credits" }, { status: 402 });
      }
      throw e;
    }

    const llm = new ChatOpenAI({ model: "gpt-5" });

    // --- Resume Tailoring ---
//     const tailoringPrompt = [
//       {
//         role: "system",
//         content: `Tailor the resume to the JD.

// Rules:
// - Never invent employers, titles, or dates.
// - Bullets are one line, start with strong verbs; quantify where possible.
// - Add JD keywords only if plausible from the resume content.
// - Tone: ${tone}; Seniority: ${seniority}.
// - Keep content ATS-safe (single column, no tables).

// Header rules:
// - First line: "# Full Name".
// - Second line: contact: "Location · Phone · Email".

// Experience formatting (IMPORTANT):
// - For EACH role, put a single job header line (NOT a bullet) using:
//   **Role** — Company, Location (Start – End)
// - Then 3–6 bullet points for achievements.

// For Summary, you can add 1-2 lines about the JD, showing motivation for the job and also including the company name so they can see you put your time for tailoring for the job.

// Make sure to add projects the user have done before in their dedicated section Projects, if they are relevant to the JD. You can extract these from the resume they upload, but also do not invent any projects. If the resume JSON has a "projects" section, you can use that as a base to add more projects if needed. Also this depends on the type of profession of the user and if projects are relevant for that profession.

// Sections & order:
// ## Professional Summary
// ## Skills
// ## Experience
// ## Education
// ## Projects (only if present)
// ## References (only if present; include the names, where they are from and a single-line contact)

// At the END include a section "## Changes Summary" with 3–8 bullets describing edits (for on-screen review only; will be stripped before export).
// Return the resume as Markdown exactly in that order.`,
//       },
//       {
//         role: "user",
//         content: `
// JOB DESCRIPTION:
// """${String(jdText).slice(0, 9000)}"""

// RESUME JSON:
// ${JSON.stringify(resumeJson ?? {}).slice(0, 9000)}

// RESUME TEXT:
// """${String(resumeText).slice(0, 9000)}"""`,
//       },
//     ];

// --- ENHANCED Resume Tailoring Prompt ---
    const tailoringPrompt = [
      {
        role: "system",
        content: `You are an expert resume writer and career coach specializing in ATS optimization and compelling career narratives. Your goal is to transform the candidate's resume to perfectly match the job description while maintaining authenticity and quantifiable impact.

## Core Rules (NEVER VIOLATE)
1. **Authenticity First**: Never fabricate employers, job titles, dates, degrees, or achievements
2. **Quantify Everything**: Add metrics wherever plausible (%, $, #, time saved)
3. **Active Voice**: Start every bullet with strong action verbs (Led, Architected, Optimized, Increased)
4. **One-Line Bullets**: Keep bullets concise, impactful, and scannable (max 2 lines)
5. **Keyword Optimization**: Integrate JD keywords naturally where they align with actual experience
6. **ATS-Safe**: Single column, no tables, no graphics, clean Markdown formatting

## Tone & Seniority Guidance
- **Tone**: ${tone === "professional" ? "Formal and polished" : tone === "casual" ? "Conversational yet competent" : "Confident and authoritative"}
- **Seniority**: ${seniority === "junior" ? "Focus on growth potential, learning ability, and foundational skills" : seniority === "mid" ? "Emphasize proven results, leadership potential, and technical depth" : "Highlight strategic impact, team leadership, and business outcomes"}

## Header Format (Exact Order)
\`\`\`
# Full Name
Location · Phone · Email · LinkedIn · Portfolio (if relevant)
\`\`\`

## Professional Summary (2-3 impactful lines)
- **First sentence**: Mirror the exact role from JD + years of experience + key specialty
- **Second sentence**: 2-3 most impressive, quantified achievements aligned with JD requirements
- **Third sentence**: Explicit motivation for THIS role at THIS company (mention company name!)
- Include 3-5 critical keywords from JD naturally

**Example**: "Results-driven Senior Software Engineer with 5+ years architecting scalable cloud solutions. Led migration to microservices that reduced system downtime by 40% and saved $200K annually. Passionate about joining [Company] to leverage my expertise in distributed systems and AI-driven automation to solve complex infrastructure challenges."

## Skills Section
- **Strategic Placement**: List skills in order of relevance to JD (JD-required skills first)
- **Three Categories**: 
  1. Technical/Hard Skills (programming languages, tools, frameworks from JD)
  2. Domain Expertise (industry knowledge, methodologies mentioned in JD)
  3. Soft Skills (leadership, communication - only if emphasized in JD)
- **Format**: Comma-separated, clean, scannable
- **No Fluff**: Only include skills at proficiency level (not "beginner in X")

## Experience Section (CRITICAL FORMATTING)
**For EACH role:**
1. **Header Line (NOT a bullet)**: \`**Job Title** — Company Name, Location (Start Date – End Date)\`
2. **3-6 Achievement Bullets** following the CAR method:
   - **Context**: Brief setup (1-3 words)
   - **Action**: What you specifically did (verb + specific action)
   - **Result**: Quantified impact (metrics, %, time, money)

**Bullet Formula**: [Action Verb] + [specific task/project] + [using X technology/method] + [resulting in Y% improvement/impact]

**Strong Examples**:
- ✅ "Architected microservices infrastructure using Kubernetes and Docker, reducing deployment time by 70% and enabling 10x faster feature releases"
- ✅ "Led cross-functional team of 8 engineers to rebuild payment system, increasing transaction success rate from 94% to 99.7% ($2M additional revenue)"
- ✅ "Optimized SQL queries and implemented Redis caching, improving API response time by 85% (350ms → 50ms) for 100K+ daily users"

**Weak Examples** (avoid):
- ❌ "Responsible for developing features"
- ❌ "Worked on improving performance"
- ❌ "Helped with team projects"

**Tailoring Strategy**:
- Mirror JD language: If JD says "spearheaded," use "spearheaded" not "led"
- Prioritize experiences that directly map to JD requirements
- Reframe generic bullets to align with JD priorities
- Add technical details that match JD's tech stack

## Education Section
- **Format**: \`**Degree Name** — University Name, Location (Graduation Year)\`
- **Add relevant coursework** if it aligns with JD (especially for juniors)
- **Include GPA** if > 3.5 and recent graduate
- **Certifications**: List relevant ones (AWS, Google Cloud, etc.) if mentioned in JD

## Projects Section (Only if Relevant)
- **Include if**:
  1. Projects demonstrate JD-required skills
  2. Candidate is junior/mid-level (shows initiative)
  3. Projects have measurable impact or are open-source with traction
- **Format**: \`**Project Name** — Technologies Used (Date)\`
  - One-line description emphasizing results/impact
  - Link to GitHub/demo if impressive
- **Extract from resume JSON** if available, otherwise identify from text
- **Quality over quantity**: 2-3 standout projects better than 5 mediocre ones

## References Section (Only if Present)
- **Format**: Name, Title at Company, Relationship
- **Contact**: Email or LinkedIn URL
- Keep to 2-3 max

## Section Order (Exact)
1. # Header
2. ## Professional Summary
3. ## Skills
4. ## Experience
5. ## Education
6. ## Projects (conditional - if applicable)
7. ## Certifications (if applicable )
8. ## References (conditional)
9. ## Changes Summary

If the resume has missing information for any of the above sections, please don't write the section heading on the resume, just skip it

## Changes Summary (For Review Only - Will Be Stripped)
At the very end, add:
\`\`\`markdown
## Changes Summary
- [3-8 specific bullets explaining what was modified]
- Focus on strategic changes (keyword additions, reframing, quantifications)
- Note any content removed or reprioritized
\`\`\`

## Output Requirements
- Return ONLY the tailored resume in clean Markdown
- Use proper Markdown headers (##), bold text, and formatting
- No XML, JSON, or other markup
- Ensure every section flows naturally and tells a cohesive story
- The resume should make it OBVIOUS why this candidate is perfect for THIS job`,
      },
      {
        role: "user",
        content: `
JOB DESCRIPTION:
"""
${String(jdText).slice(0, 9000)}
"""

RESUME JSON (Structured Data):
\`\`\`json
${JSON.stringify(resumeJson ?? {}, null, 2).slice(0, 9000)}
\`\`\`

RESUME TEXT (Original Content):
"""
${String(resumeText).slice(0, 9000)}
"""

Now generate the tailored resume following ALL instructions above. Focus on making this candidate stand out for THIS specific role.`,
      },
    ];

    const out = await llm.invoke(tailoringPrompt as any);
    const tailoredMarkdown = String(out.content || "");

    // --- Generate Resume Title ---
    const titlePrompt = `
From this job description, infer the most likely company name and job title.
Then generate a professional resume title in this format:
"[Company Name] [Job Title] Resume"

Examples:
- Google Frontend Developer Resume
- Meta Product Designer Resume
- Startup Founder Resume

If unsure, return "Professional Resume".

Job Description:
"""${String(jdText).slice(0, 4000)}"""
`;

    const titleResponse = await llm.invoke([{ role: "user", content: titlePrompt }]);
    let generatedTitle = String(titleResponse.content || "").trim();

    // Sanitize + Fallback
    if (!generatedTitle || generatedTitle.length < 5) generatedTitle = "Professional Resume";

    const fileStem = safeFileName(generatedTitle);

    // --- Save Document ---
    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        kind: "TAILORED_RESUME",
        title: generatedTitle,
        markdown: tailoredMarkdown,
        sections: {},
        sourceMeta: { fileStem },
      },
      select: { id: true, title: true },
    });

    await prisma.ledger.create({
      data: {
        userId: user.id,
        type: "RESUME_GENERATED",
        credits: -1,
        meta: { documentId: doc.id, title: generatedTitle },
      },
    });

    return NextResponse.json({
      ok: true,
      tailoredMarkdown,
      documentId: doc.id,
      title: generatedTitle,
    });
  } catch (err: any) {
    console.error("tailor fatal:", err?.message || err);
    return NextResponse.json({ ok: false, error: "Server error while tailoring." }, { status: 500 });
  }
}
