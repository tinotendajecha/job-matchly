// app/api/resume-builder/ai-suggest/route.ts
import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const trunc = (s: unknown, n: number) => String(s ?? "").slice(0, n);

const ExperienceContextSchema = z.object({
  role: z.string().optional().default(""),
  company: z.string().optional().default(""),
  achievements: z.array(z.string()).optional().default([]),
});

const SummaryRequestSchema = z.object({
  type: z.literal("summary"),
  title: z.string().optional().default(""),
  currentSummary: z.string().optional().default(""),
  experience: z.array(ExperienceContextSchema).optional().default([]),
  skills: z
    .object({
      technical: z.array(z.string()).optional().default([]),
      soft: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({ technical: [], soft: [] }),
});

const AchievementsRequestSchema = z.object({
  type: z.literal("achievements"),
  role: z.string().optional().default(""),
  company: z.string().optional().default(""),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  isCurrent: z.boolean().optional().default(false),
  existingAchievements: z.array(z.string()).optional().default([]),
  title: z.string().optional().default(""),
  summary: z.string().optional().default(""),
});

const SkillsRequestSchema = z.object({
  type: z.literal("skills"),
  title: z.string().optional().default(""),
  summary: z.string().optional().default(""),
  experience: z.array(ExperienceContextSchema).optional().default([]),
  existingTechnical: z.array(z.string()).optional().default([]),
  existingSoft: z.array(z.string()).optional().default([]),
});

const ProjectDescriptionRequestSchema = z.object({
  type: z.literal("project-description"),
  name: z.string().optional().default(""),
  technologies: z.array(z.string()).optional().default([]),
  currentDescription: z.string().optional().default(""),
});

const RequestSchema = z.discriminatedUnion("type", [
  SummaryRequestSchema,
  AchievementsRequestSchema,
  SkillsRequestSchema,
  ProjectDescriptionRequestSchema,
]);

const SummaryResultSchema = z.object({
  summary: z.string().min(1).describe("The polished professional summary, 2-3 sentences, under 300 characters."),
});

const AchievementsResultSchema = z.object({
  achievements: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("3-4 new, one-line achievement bullets in the CAR method, no leading bullet character."),
});

const SkillsResultSchema = z.object({
  technical: z.array(z.string()).max(8).describe("Up to 6 suggested technical/hard skills, most relevant first."),
  soft: z.array(z.string()).max(6).describe("Up to 4 suggested soft skills, most relevant first."),
});

const ProjectDescriptionResultSchema = z.object({
  description: z.string().min(1).describe("A concise 1-2 sentence project description."),
});

type SuggestInput = z.infer<typeof RequestSchema>;

function buildPrompt(input: SuggestInput): { system: string; user: string; schema: z.ZodTypeAny } {
  switch (input.type) {
    case "summary": {
      const expLines = input.experience
        .slice(0, 5)
        .map(
          (e) =>
            `- ${e.role || "Role"} at ${e.company || "Company"}${
              e.achievements.length ? `: ${e.achievements.slice(0, 3).join("; ")}` : ""
            }`
        )
        .join("\n");
      const skillsLine = [...input.skills.technical, ...input.skills.soft].slice(0, 12).join(", ");
      return {
        schema: SummaryResultSchema,
        system: `You are an expert resume writer. Write ONE polished professional summary for a resume (2-3 sentences, under 300 characters).

Rules:
- Mirror the candidate's job title and seniority.
- Weave in 1-2 of their strongest achievements or skills from the context below, if any are given.
- Confident, active language. Never use first-person pronouns ("I", "my", "me").
- No fabrication: only use facts given in the context; do not invent employers, metrics, or skills.
- If an existing summary is provided, improve and tighten it rather than discarding it wholesale.
- Return ONLY the summary text (no headers, no quotes, no markdown).`,
        user: `Job Title: ${trunc(input.title, 200) || "—"}

Existing Summary: ${trunc(input.currentSummary, 1000) || "(none — write from scratch using the context below)"}

Experience:
${expLines || "(none provided)"}

Skills: ${skillsLine || "(none provided)"}`,
      };
    }
    case "achievements": {
      return {
        schema: AchievementsResultSchema,
        system: `You are an expert resume writer specializing in the CAR method (Context, Action, Result).
Generate 3-4 NEW one-line achievement bullets for the job role below. They must be DIFFERENT from any bullets already listed — never repeat or lightly rephrase an existing one.

Rules:
- Each bullet: [strong action verb] + [specific task/responsibility] + [plausible, realistic result or scope].
- Start every bullet with a strong action verb (Led, Built, Reduced, Launched, Automated, Streamlined, etc.) — never "Responsible for" or "Worked on".
- Only use numbers/metrics when they're a plausible estimate for this role; otherwise describe scope/impact qualitatively. Do not invent implausibly precise statistics.
- One line each, no leading bullet character, no trailing period.
- Infer realistic day-to-day responsibilities for this title/industry when details are sparse, but never invent specific employers, clients, or tools not implied by the context.
- Return 3-4 bullets only.`,
        user: `Role: ${trunc(input.role, 200) || "—"}
Company: ${trunc(input.company, 200) || "—"}
Dates: ${trunc(input.startDate, 20)} – ${input.isCurrent ? "Present" : trunc(input.endDate, 20)}
Candidate's overall title/summary: ${trunc(input.title, 200)} ${trunc(input.summary, 500)}

Existing achievements for this role (do NOT repeat these):
${input.existingAchievements.length ? input.existingAchievements.map((a) => `- ${a}`).join("\n") : "(none yet)"}`,
      };
    }
    case "skills": {
      const expLines = input.experience
        .slice(0, 5)
        .map(
          (e) =>
            `- ${e.role || "Role"} at ${e.company || "Company"}${
              e.achievements.length ? `: ${e.achievements.slice(0, 3).join("; ")}` : ""
            }`
        )
        .join("\n");
      return {
        schema: SkillsResultSchema,
        system: `You are a resume/ATS keyword specialist. Suggest relevant skills for this candidate to ADD to their resume, based on their job title, summary, and experience.

Rules:
- Suggest up to 6 Technical/Hard Skills and up to 4 Soft Skills.
- Do NOT suggest any skill that is already listed (case-insensitive, including close synonyms).
- Keep each skill short (1-3 words), e.g. "React", "Stakeholder Management".
- Only suggest skills plausible for this candidate's role/industry based on the context — do not invent unrelated skills.
- Order each list by relevance (most important first).`,
        user: `Job Title: ${trunc(input.title, 200) || "—"}
Summary: ${trunc(input.summary, 800) || "—"}

Experience:
${expLines || "(none provided)"}

Already-listed Technical Skills (do not repeat): ${input.existingTechnical.join(", ") || "(none)"}
Already-listed Soft Skills (do not repeat): ${input.existingSoft.join(", ") || "(none)"}`,
      };
    }
    case "project-description": {
      return {
        schema: ProjectDescriptionResultSchema,
        system: `You are an expert resume writer. Write ONE concise, impact-focused project description for a resume "Projects" section (1-2 sentences).

Rules:
- Emphasize the candidate's role, key technology used, and the outcome/impact of the project.
- Active voice, no first-person pronouns.
- Use the technologies listed if provided.
- If a current description is provided, improve and tighten it rather than discarding the effort already there.
- No fabrication of metrics or outcomes not implied by the given description.
- Return ONLY the description text.`,
        user: `Project Name: ${trunc(input.name, 200) || "—"}
Technologies: ${input.technologies.join(", ") || "—"}
Current Description: ${
          trunc(input.currentDescription, 1000) || "(none — write from scratch using the name and technologies)"
        }`,
      };
    }
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    if (!user.emailVerified)
      return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });

    const body = await req.json().catch(() => null);
    const parsedInput = RequestSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const { system, user: userMsg, schema } = buildPrompt(parsedInput.data);
    const llm = new ChatOpenAI({ model: "gpt-5-mini" });

    let result: any;
    try {
      result = await llm.withStructuredOutput(schema).invoke([
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ]);
    } catch (e: any) {
      console.warn("ai-suggest structured output failed, falling back:", e?.message || e);
      const resp = await llm.invoke([
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ]);
      result = schema.parse(JSON.parse(String(resp.content || "{}")));
    }

    return NextResponse.json({ ok: true, type: parsedInput.data.type, result });
  } catch (err: any) {
    console.error("ai-suggest fatal:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: "Server error while generating suggestion." },
      { status: 500 }
    );
  }
}
