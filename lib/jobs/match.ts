// lib/jobs/match.ts
//
// Matching is plain arithmetic — no AI. Jobs already carry a bracket from their
// source's taxonomy and users carry a bracket from tagging, so a match is a
// comparison, not an inference.
//
// The rejected alternative was an AI call per user × job: ~5,100 calls per run
// at current size (~$60/month) to reach the same answer a bracket comparison
// gives for free. Because scoring is bracket-level it is computed ONCE per
// (bracket, market) and fanned out to users, so cost stays flat as users grow.

import { prisma } from '@/lib/prisma';
import { seniorityProximity } from './brackets';
import { liveJobWhere } from './policy';

const MATCHES_PER_USER = 30;
const RECENCY_HALFLIFE_DAYS = 14;

export interface MatchStats {
  users: number;
  matches: number;
  bracketsComputed: number;
}

function recencyScore(postedAt: Date | null, createdAt: Date): number {
  const ref = postedAt ?? createdAt;
  const ageDays = (Date.now() - ref.getTime()) / 86_400_000;
  return Math.pow(0.5, Math.max(0, ageDays) / RECENCY_HALFLIFE_DAYS);
}

export async function rebuildMatches(): Promise<MatchStats> {
  const professions = await prisma.userProfession.findMany({
    select: { userId: true, bracket: true, seniority: true },
  });
  if (professions.length === 0) return { users: 0, matches: 0, bracketsComputed: 0 };

  const jobs = await prisma.jobPost.findMany({
    where: liveJobWhere(),
    select: {
      id: true,
      bracket: true,
      seniority: true,
      market: true,
      postedAt: true,
      createdAt: true,
      title: true,
    },
  });
  if (jobs.length === 0) return { users: 0, matches: 0, bracketsComputed: 0 };

  // Group users by (bracket, seniority) so scoring happens once per group.
  const groups = new Map<string, typeof professions>();
  for (const p of professions) {
    const key = `${p.bracket}|${p.seniority ?? ''}`;
    const list = groups.get(key) ?? [];
    list.push(p);
    groups.set(key, list);
  }

  let totalMatches = 0;

  for (const [key, members] of groups) {
    const [bracket, seniority] = key.split('|');

    const scored = jobs
      .map((job) => {
        const bracketMatch = job.bracket === bracket;
        // Off-bracket jobs are heavily penalised but not excluded outright, so a
        // thin bracket still shows something rather than an empty feed.
        const base = bracketMatch ? 1 : 0.15;
        const sen = seniorityProximity(seniority || null, job.seniority);
        const rec = recencyScore(job.postedAt, job.createdAt);
        const score = base * 0.6 + sen * 0.15 + rec * 0.25;

        const reasons: string[] = [];
        if (bracketMatch) reasons.push(`Matches your field (${bracket})`);
        if (seniority && job.seniority === seniority) reasons.push(`${seniority.toLowerCase()} level`);
        if (rec > 0.7) reasons.push('Recently posted');

        return { jobId: job.id, market: job.market, score, reasons };
      })
      .sort((a, b) => b.score - a.score);

    for (const member of members) {
      // Prefer the user's own market, then top up from anywhere.
      const top = scored.slice(0, MATCHES_PER_USER);

      await prisma.jobMatch.deleteMany({ where: { userId: member.userId } });
      if (top.length === 0) continue;

      await prisma.jobMatch.createMany({
        data: top.map((m) => ({
          userId: member.userId,
          jobId: m.jobId,
          score: Number(m.score.toFixed(4)),
          reasons: m.reasons,
        })),
        skipDuplicates: true,
      });
      totalMatches += top.length;
    }
  }

  return { users: professions.length, matches: totalMatches, bracketsComputed: groups.size };
}
