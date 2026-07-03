// Curated career intelligence content.
// Placeholder data — shaped to match the future intelligence-agent API so the
// UI can switch to a fetch without structural changes.

export type BriefingSource = 'reddit' | 'quora' | 'linkedin' | 'newsletter';

export interface BriefingItem {
  id: string;
  source: BriefingSource;
  sourceDetail: string;
  category: string;
  title: string;
  summary: string;
  image: string;
  readTime: string;
  stat: string;
  url: string;
}

export const SOURCE_META: Record<BriefingSource, { label: string; dot: string }> = {
  reddit: { label: 'Reddit', dot: 'bg-orange-500' },
  quora: { label: 'Quora', dot: 'bg-red-600' },
  linkedin: { label: 'LinkedIn', dot: 'bg-sky-600' },
  newsletter: { label: 'Newsletter', dot: 'bg-violet-500' },
};

export const BRIEFING_FEATURED: BriefingItem = {
  id: 'feat-1',
  source: 'reddit',
  sourceDetail: 'r/recruiting',
  category: 'Resumes',
  title: 'A recruiter explains why 90% of resumes get rejected in under 10 seconds',
  summary:
    'A veteran tech recruiter breaks down what actually happens in the first screen: most resumes fail on missing measurable outcomes and vague titles — not formatting. The thread includes real before-and-after bullet rewrites that landed interviews.',
  image:
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
  readTime: '4 min read',
  stat: '142 comments',
  url: 'https://www.reddit.com/r/recruiting/',
};

export const BRIEFING_ITEMS: BriefingItem[] = [
  {
    id: 'item-1',
    source: 'quora',
    sourceDetail: 'quora.com',
    category: 'Offers',
    title: 'Should I tell a hiring manager I have another offer?',
    summary:
      'Hiring managers weigh in on when a competing offer strengthens your position — and the one timing mistake that makes it backfire.',
    image:
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
    readTime: '3 min read',
    stat: '89 upvotes',
    url: 'https://www.quora.com/topic/Job-Offers',
  },
  {
    id: 'item-2',
    source: 'linkedin',
    sourceDetail: 'linkedin.com',
    category: 'Interviews',
    title: 'A Google recruiter shares the 5 interview mistakes that cost offers',
    summary:
      'Beyond wrong answers: rambling intros, no questions for the panel, and underselling collaborative work rank highest on the list.',
    image:
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
    readTime: '5 min read',
    stat: '56 reactions',
    url: 'https://www.linkedin.com/pulse/topics/hiring-and-recruiting/',
  },
  {
    id: 'item-3',
    source: 'newsletter',
    sourceDetail: 'The Pay Check',
    category: 'Salary',
    title: 'How I negotiated a 30% raise without a competing offer',
    summary:
      'A step-by-step account of building a business case from impact data — including the exact script used in the conversation.',
    image:
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80',
    readTime: '6 min read',
    stat: '1.2k readers',
    url: 'https://www.reddit.com/r/negotiation/',
  },
  {
    id: 'item-4',
    source: 'reddit',
    sourceDetail: 'r/jobs',
    category: 'Interviews',
    title: 'I walked out of an interview before it was over. Here’s why.',
    summary:
      'Candidates share the red flags that justify ending an interview early — and how to exit gracefully without burning the bridge.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    readTime: '4 min read',
    stat: '73 comments',
    url: 'https://www.reddit.com/r/jobs/',
  },
];

// One tip per day, rotated by day-of-year.
export const DAILY_TIPS: string[] = [
  'Use action verbs like "increased," "improved," and "led" to start your resume bullets. They’re more impactful than passive language.',
  'Before any interview, research the company’s recent news and projects. It helps you answer better and sets you apart from other candidates.',
  'Tailor your resume’s top third to the job description — that’s the part recruiters read first.',
  'Quantify everything you can: "cut load time by 40%" beats "improved performance" every time.',
  'Send a short, specific thank-you note within 24 hours of an interview. Mention one thing you discussed.',
  'Keep a "wins file" — note every achievement as it happens so your next resume update takes minutes, not days.',
  'When negotiating salary, let the employer name a number first whenever possible. Anchor high if you must go first.',
];

export function getDailyTip(date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

// Conversation starters for the Career Coach card.
export const COACH_STARTERS: string[] = [
  'How do I explain a gap in my resume?',
  'What should I ask at the end of an interview?',
  'Is my experience section too long?',
];
