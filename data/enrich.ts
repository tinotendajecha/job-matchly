// data/enrich.ts
// Uses an LLM to turn raw scraped text into a clean, categorized briefing entry —
// and to filter out search noise that isn't actually useful career content.

import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";

export const BRIEFING_CATEGORIES = [
  "Resumes",
  "Interviews",
  "Salary",
  "Offers",
  "Career Growth",
  "Job Search",
  "Workplace",
] as const;

const EnrichResultSchema = z.object({
  relevant: z
    .boolean()
    .describe(
      "True only if this is genuinely useful, specific career/job-search advice or a real discussion about resumes, interviews, salary, job offers, or workplace life. False for spam, unrelated content, or generic listicles with no substance."
    ),
  title: z
    .string()
    .describe("A punchy, specific headline for this piece, under 110 characters. Rewrite the original if it's vague or clickbait."),
  summary: z
    .string()
    .describe("2-3 sentence summary of the actual insight or advice, written for someone scanning a career dashboard feed. No fluff, no 'this article discusses...' framing."),
  category: z.enum(BRIEFING_CATEGORIES),
});

export type EnrichResult = z.infer<typeof EnrichResultSchema>;

export async function enrichArticle(input: { title: string; text: string; url: string }): Promise<EnrichResult | null> {
  const llm = new ChatOpenAI({ model: "gpt-5-mini" });
  const truncated = input.text.slice(0, 6000);

  const system = `You curate a "career briefing" feed for a resume/job-search product's dashboard. Given a scraped article or Reddit thread, decide if it's worth including and produce a clean title, summary, and category.`;
  const user = `URL: ${input.url}\nOriginal title: ${input.title}\n\nContent:\n${truncated}`;

  try {
    return await llm.withStructuredOutput(EnrichResultSchema).invoke([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
  } catch (e) {
    console.warn("enrichArticle structured output failed, falling back:", (e as Error)?.message || e);
    try {
      const resp = await llm.invoke([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
      return EnrichResultSchema.parse(JSON.parse(String(resp.content || "{}")));
    } catch (e2) {
      console.warn("enrichArticle fallback also failed:", (e2 as Error)?.message || e2);
      return null;
    }
  }
}
