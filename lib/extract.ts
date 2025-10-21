// lib/extract.ts
import { ChatOpenAI } from "@langchain/openai";

const BOARDS = [/indeed/i, /linkedin/i, /glassdoor/i, /join/i, /workable/i, /greenhouse/i];

export async function extractCompanyAndRoleLC(jdText: string) {
  const model = new ChatOpenAI({ model: "gpt-5-mini", temperature: 0 });
  const sys = `Extract the most likely employer (company) name and the primary job title from the job description.
Return strict JSON object: {"company":"","role":""}. If unknown, use empty strings. Do not add extra keys.`;
  const user = String(jdText).slice(0, 9000);

  const result = await model.invoke([
    { role: "system", content: sys },
    { role: "user", content: user },
  ] as any);

  const text = String(result.content ?? "{}");
  let parsed: any = {};
  try { parsed = JSON.parse(text); } catch { parsed = {}; }

  let company = typeof parsed.company === "string" ? parsed.company.trim() : "";
  const role   = typeof parsed.role === "string" ? parsed.role.trim() : "";

  // Optional: ignore known job boards
  if (company && BOARDS.some(rx => rx.test(company))) company = "";

  return { company, role };
}
