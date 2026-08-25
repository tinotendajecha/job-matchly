// data/jobs/tagUsers.ts
//
// Works out which profession bracket each user belongs to.
//
// COST DISCIPLINE: rules first, AI last. Keyword matching on document titles is
// free and — given titles like "The Focus Group Junior Data Scientist" — usually
// decisive. AI is only called when the rules find nothing, and then it is sent
// only the first ~600 characters of a résumé (the opening summary states the
// profession; sending the whole document is wasted spend).
//
// Every row records `method` and `evidence`, so a wrong bracket can be explained
// and the keyword map improved rather than being treated as an oracle.

import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { prisma } from '@/lib/prisma';
import { BRACKETS, guessBracket, seniorityFromTitle, type Bracket } from '@/lib/jobs/brackets';

/** Titles that carry no role information — validated against the live data. */
const GENERIC_TITLE = /^(professional resume|resume|untitled|my resume|cover letter( for .*)?)$/i;

/** Résumé prefix sent to the AI fallback. Deliberately small. */
const RESUME_SNIPPET_CHARS = 600;

export interface TagResult {
  tagged: number;
  byRules: number;
  byAi: number;
  skipped: number;
  aiInputChars: number;
}

/** "The Focus Group Junior Data Scientist Resume" -> "The Focus Group Junior Data Scientist" */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*(resume|cv|cover letter)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Document titles are "<Company> <Role>", and the company name can hijack the
 * match — "Cimas Health Group Direct Sales Agent" is a sales job, not a
 * healthcare one. The role sits at the end, so try the tail before the whole
 * string, and only accept a STRONG keyword (a weak one describes grade, not
 * field, and would tag someone off a word like "assistant").
 */
function bracketFromRoleTitle(title: string): { bracket: Bracket; matched: string } | null {
  const words = title.split(/\s+/);
  const candidates = [
    words.slice(-4).join(' '),
    words.slice(-6).join(' '),
    title,
  ];
  for (const candidate of candidates) {
    const guess = guessBracket(candidate);
    if (guess?.strong) return { bracket: guess.bracket, matched: candidate };
  }
  return null;
}

const AiTagSchema = z.object({
  bracket: z.enum(BRACKETS as unknown as [string, ...string[]]).describe('Best-fitting profession bracket'),
  primaryRole: z.string().max(80).describe('Their job title in 1-4 words, e.g. "Software Developer"'),
  seniority: z
    .enum(['INTERN', 'GRADUATE', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'])
    .nullable()
    .describe('Career level if evident, otherwise null'),
  confidence: z.number().min(0).max(1),
});

async function aiTag(snippet: string): Promise<z.infer<typeof AiTagSchema> | null> {
  try {
    const llm = new ChatOpenAI({ model: 'gpt-5-mini' });
    return await llm.withStructuredOutput(AiTagSchema).invoke([
      {
        role: 'system',
        content: `Classify a job seeker into ONE profession bracket from this list:
${BRACKETS.join(', ')}

Base it only on the text given. If the text is too vague to tell, choose "General" with low confidence rather than guessing a specialism.`,
      },
      { role: 'user', content: snippet },
    ]);
  } catch (e) {
    console.warn('  ai tag failed:', (e as Error)?.message || e);
    return null;
  }
}

export async function tagUsers(options: { useAiFallback?: boolean } = {}): Promise<TagResult> {
  const { useAiFallback = true } = options;
  const result: TagResult = { tagged: 0, byRules: 0, byAi: 0, skipped: 0, aiInputChars: 0 };

  // Two queries total, joined in memory — never one query per user.
  const [users, documents, profiles] = await Promise.all([
    prisma.user.findMany({ select: { id: true } }),
    prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      select: { userId: true, title: true, createdAt: true },
    }),
    prisma.profile.findMany({
      where: { resumeMarkdown: { not: null } },
      select: { userId: true, resumeMarkdown: true },
    }),
  ]);

  const titlesByUser = new Map<string, string[]>();
  for (const doc of documents) {
    if (!doc.title) continue;
    const clean = cleanTitle(doc.title);
    if (!clean || GENERIC_TITLE.test(clean)) continue;
    const list = titlesByUser.get(doc.userId) ?? [];
    list.push(clean);
    titlesByUser.set(doc.userId, list);
  }

  const resumeByUser = new Map(profiles.map((p) => [p.userId, p.resumeMarkdown as string]));

  for (const user of users) {
    const titles = titlesByUser.get(user.id) ?? [];
    const resume = resumeByUser.get(user.id);

    let bracket: Bracket | null = null;
    let evidence: string | null = null;
    let method: 'RULES' | 'AI' = 'RULES';
    let primaryRole: string | null = null;
    let seniority: string | null = null;
    let confidence = 0;

    // 1) Free: keyword match on their most recent specific document titles.
    for (const title of titles.slice(0, 5)) {
      const hit = bracketFromRoleTitle(title);
      if (hit) {
        bracket = hit.bracket;
        evidence = `document title: "${title}" (matched on "${hit.matched}")`;
        primaryRole = title;
        seniority = seniorityFromTitle(title);
        confidence = 0.8;
        break;
      }
    }

    // 2) Free: keyword match on the résumé's opening summary only.
    const snippet = resume ? resume.replace(/\s+/g, ' ').trim().slice(0, RESUME_SNIPPET_CHARS) : null;
    if (!bracket && snippet) {
      const guess = guessBracket(snippet);
      if (guess?.strong) {
        bracket = guess.bracket;
        evidence = `resume opening (matched "${guess.keyword}"): "${snippet.slice(0, 100)}…"`;
        seniority = seniorityFromTitle(snippet);
        confidence = 0.6;
      }
    }

    // 3) Paid, last resort — and only on that same small snippet.
    if (!bracket && useAiFallback) {
      const input = snippet || titles.slice(0, 3).join(' · ') || null;
      if (input) {
        result.aiInputChars += input.length;
        const ai = await aiTag(input);
        if (ai) {
          bracket = ai.bracket as Bracket;
          primaryRole = ai.primaryRole;
          seniority = ai.seniority;
          confidence = ai.confidence;
          evidence = `ai from: "${input.slice(0, 120)}…"`;
          method = 'AI';
        }
      }
    }

    // No evidence at all — skip rather than guess.
    if (!bracket) {
      result.skipped++;
      continue;
    }

    await prisma.userProfession.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bracket,
        primaryRole,
        seniority,
        confidence,
        method,
        evidence,
      },
      update: { bracket, primaryRole, seniority, confidence, method, evidence, derivedAt: new Date() },
    });

    result.tagged++;
    if (method === 'AI') result.byAi++;
    else result.byRules++;
  }

  return result;
}
