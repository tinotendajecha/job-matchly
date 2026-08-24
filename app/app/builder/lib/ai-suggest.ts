// app/app/builder/lib/ai-suggest.ts
async function callAiSuggest<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/resume-builder/ai-suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({ ok: false, error: 'Unexpected response from server' }));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'AI suggestion failed');
  }
  return data.result as T;
}

export type ExperienceContext = {
  role: string;
  company: string;
  achievements: string[];
};

export function suggestSummary(input: {
  title: string;
  currentSummary: string;
  experience: ExperienceContext[];
  skills: { technical: string[]; soft: string[] };
}): Promise<{ summary: string }> {
  return callAiSuggest({ type: 'summary', ...input });
}

export function suggestAchievements(input: {
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  existingAchievements: string[];
  title: string;
  summary: string;
}): Promise<{ achievements: string[] }> {
  return callAiSuggest({ type: 'achievements', ...input });
}

export function suggestSkills(input: {
  title: string;
  summary: string;
  experience: ExperienceContext[];
  existingTechnical: string[];
  existingSoft: string[];
}): Promise<{ technical: string[]; soft: string[] }> {
  return callAiSuggest({ type: 'skills', ...input });
}

export function suggestProjectDescription(input: {
  name: string;
  technologies: string[];
  currentDescription: string;
}): Promise<{ description: string }> {
  return callAiSuggest({ type: 'project-description', ...input });
}
