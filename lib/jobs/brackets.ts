// lib/jobs/brackets.ts
//
// Profession brackets. Users are grouped into these rather than tagged
// individually, so everyone in a bracket can be shown the same jobs — which is
// what keeps matching a cheap lookup instead of an AI call per user × job.
//
// Both sources publish their own taxonomy (VacancyMail 51 categories, Adzuna
// 30), so a job's bracket is derived from the category it was crawled under.
// No AI is involved in classifying a job.

export const BRACKETS = [
  'Software & IT',
  'Finance & Accounting',
  'Admin & Office',
  'Sales & Marketing',
  'Engineering & Technical',
  'Healthcare',
  'Education',
  'NGO & Development',
  'Logistics & Supply Chain',
  'Hospitality & Tourism',
  'Legal & Compliance',
  'General',
] as const;

export type Bracket = (typeof BRACKETS)[number];

export const DEFAULT_BRACKET: Bracket = 'General';

/** VacancyMail category slug -> bracket. Slugs verified against their /categories/ page. */
export const VACANCYMAIL_BRACKETS: Record<string, Bracket> = {
  'ict-computer-jobs-in-zimbabwe': 'Software & IT',
  'accounting-finance-jobs-in-zimbabwe': 'Finance & Accounting',
  'banking-jobs-in-zimbabwe': 'Finance & Accounting',
  'insurance-jobs-in-zimbabwe': 'Finance & Accounting',
  'admin-office-jobs-in-zimbabwe': 'Admin & Office',
  'human-resources-jobs-in-zimbabwe': 'Admin & Office',
  'library-jobs-in-zimbabwe': 'Admin & Office',
  'sales-marketing-jobs-in-zimbabwe': 'Sales & Marketing',
  'pr-communication-graphic-design-jobs-in-zimbabwe': 'Sales & Marketing',
  'media-jobs-in-zimbabwe': 'Sales & Marketing',
  'retail-jobs-in-zimbabwe': 'Sales & Marketing',
  'engineering-jobs-in-zimbabwe': 'Engineering & Technical',
  'mechanical-automotive-jobs': 'Engineering & Technical',
  'electrical-electronics-jobs': 'Engineering & Technical',
  'construction-jobs-in-zimbabwe': 'Engineering & Technical',
  'manufacturing-jobs-in-zimbabwe': 'Engineering & Technical',
  'mining-jobs-in-zimbabwe': 'Engineering & Technical',
  'science-laboratory-jobs': 'Engineering & Technical',
  'healthcare-jobs-in-zimbabwe': 'Healthcare',
  'nursing-jobs-in-zimbabwe': 'Healthcare',
  'education-teaching-jobs-in-zimbabwe': 'Education',
  'ngo-social-services-jobs-in-zimbabwe': 'NGO & Development',
  'consultancy-jobs-in-zimbabwe': 'NGO & Development',
  'environmental-jobs-in-zimbabwe': 'NGO & Development',
  'driving-logistics-jobs-in-zimbabwe': 'Logistics & Supply Chain',
  'procurement-and-supply-chain-management-jobs-in-zimbabwe': 'Logistics & Supply Chain',
  'stores-warehouse-jobs-in-zimbabwe': 'Logistics & Supply Chain',
  'aviation-jobs-in-zimbabwe': 'Logistics & Supply Chain',
  'tourism-jobs-in-zimbabwe': 'Hospitality & Tourism',
  'cruise-ship-and-cabin-crew-jobs-in-zimbabwe': 'Hospitality & Tourism',
  'cruise-ship-cabin-crew-jobs': 'Hospitality & Tourism',
  'legal-jobs-in-zimbabwe': 'Legal & Compliance',
  'she-jobs-in-zimbabwe': 'Legal & Compliance',
  'agriculture-jobs-in-zimbabwe': 'General',
  'general-work-jobs-in-zimbabwe': 'General',
  'security-jobs-in-zimbabwe': 'General',
  'real-estate-jobs-in-zimbabwe': 'General',
  'strategic-management-jobs-in-zimbabwe': 'General',
  'town-planning-urban-development-jobs': 'General',
  'carpentry-furniture-textile-jobs': 'General',
  'carpentry-design-and-textile-jobs': 'General',
  'funeral-services-mortuary-jobs': 'General',
  'sports-recreation-jobs-in-zimbabwe': 'General',
  'diaspora-jobs': 'General',
};

/**
 * Cross-cutting SENIORITY categories, not professions. A job here still needs
 * its bracket read from the title — otherwise a graduate developer lands in an
 * "early career" bucket instead of with the IT jobs.
 */
export const SENIORITY_CATEGORIES: Record<string, string> = {
  'graduate-trainee-jobs-in-zimbabwe': 'GRADUATE',
  'attachment-internship-jobs-in-zimbabwe': 'INTERN',
  'apprenticeship-jobs-in-zimbabwe': 'INTERN',
  'graduate-jobs': 'GRADUATE',
  // ihararejobs.com equivalents
  'graduate-jobs-in-zimbabwe': 'GRADUATE',
  'graduate-trainees': 'GRADUATE',
  'internship': 'INTERN',
  'attachment-jobs': 'INTERN',
  'apprentice': 'INTERN',
};

/** Not jobs at all — excluded at crawl time so they never reach the feed. */
export const EXCLUDED_CATEGORIES = new Set([
  'tenders',
  'scholarships-jobs-in-zimbabwe',
  'student-loans',
  'college-nursing-intakes-jobs-in-zimbabwe',
  // ihararejobs.com: not jobs, or not a profession
  'scholarships',
  'college-intake',
  'voluntary',
  'minimal-qualifications',
  'gokwe',
  'other',
]);


/**
 * ihararejobs.com category slug -> bracket. Their taxonomy is broader than
 * VacancyMail's (103 categories) and includes some noise, so only the slugs
 * that map to a real profession are listed; anything unlisted falls back to
 * the role title via resolveBracket.
 */
export const IHARAREJOBS_BRACKETS: Record<string, Bracket> = {
  'ict': 'Software & IT',
  'software-engineering': 'Software & IT',
  'telecommunications': 'Software & IT',
  'gis-analysis': 'Software & IT',
  'accounting': 'Finance & Accounting',
  'accounting-jobs-in-zimbabwe': 'Finance & Accounting',
  'auditing': 'Finance & Accounting',
  'banking-and-finance-jobs': 'Finance & Accounting',
  'finance': 'Finance & Accounting',
  'economics': 'Finance & Accounting',
  'risk-and-insurance': 'Finance & Accounting',
  'statistics': 'Finance & Accounting',
  'admin-and-office-jobs': 'Admin & Office',
  'administration': 'Admin & Office',
  'human-resources': 'Admin & Office',
  'secretarial-receptionist': 'Admin & Office',
  'records-management': 'Admin & Office',
  'project-administration': 'Admin & Office',
  'librarian-jobs': 'Admin & Office',
  'sales-and-marketing': 'Sales & Marketing',
  'communication-and-marketing-jobs': 'Sales & Marketing',
  'communication-jobs': 'Sales & Marketing',
  'retail-wholesale': 'Sales & Marketing',
  'media': 'Sales & Marketing',
  'journalism': 'Sales & Marketing',
  'graphic-designer-jobs-in-ziimbabwe': 'Sales & Marketing',
  'designer': 'Sales & Marketing',
  'customer-service': 'Sales & Marketing',
  'real-estate': 'Sales & Marketing',
  'engineering': 'Engineering & Technical',
  'engineering-jobs-in-zimbabwe': 'Engineering & Technical',
  'electrician': 'Engineering & Technical',
  'mechanic': 'Engineering & Technical',
  'technician': 'Engineering & Technical',
  'artisan': 'Engineering & Technical',
  'automotive': 'Engineering & Technical',
  'construction': 'Engineering & Technical',
  'construction-jobs': 'Engineering & Technical',
  'mining': 'Engineering & Technical',
  'mining-jobs-in-zimbabwe': 'Engineering & Technical',
  'applied-chemistry': 'Engineering & Technical',
  'biotechnology': 'Engineering & Technical',
  'quality-assurance': 'Engineering & Technical',
  'factory-jobs': 'Engineering & Technical',
  'operators-jobs': 'Engineering & Technical',
  'woodwork': 'Engineering & Technical',
  'aviation': 'Engineering & Technical',
  'town-planner': 'Engineering & Technical',
  'urban-planning': 'Engineering & Technical',
  'healthcare': 'Healthcare',
  'nursing-jobs-in-zimbabwe': 'Healthcare',
  'pharmacist-jobs': 'Healthcare',
  'environmental-health': 'Healthcare',
  'veterinary-jobs': 'Healthcare',
  'psychology': 'Healthcare',
  'education': 'Education',
  'teaching-jobs-in-zimbabwe': 'Education',
  'lecturing-jobs': 'Education',
  'ngo-jobs-in-zimbabwe': 'NGO & Development',
  'ngos': 'NGO & Development',
  'social-work': 'NGO & Development',
  'development-studies': 'NGO & Development',
  'environmental-management': 'NGO & Development',
  'wildlife-jobs': 'NGO & Development',
  'logistics': 'Logistics & Supply Chain',
  'purchasing-and-supply': 'Logistics & Supply Chain',
  'transportation': 'Logistics & Supply Chain',
  'driver': 'Logistics & Supply Chain',
  'hospitality': 'Hospitality & Tourism',
  'hotel-and-catering-jobs': 'Hospitality & Tourism',
  'tourism-and-hospitality': 'Hospitality & Tourism',
  'chef-jobs': 'Hospitality & Tourism',
  'law': 'Legal & Compliance',
  'general-jobs': 'General',
  'business': 'General',
  'manager': 'General',
  'executive': 'General',
  'supervisor': 'General',
  'branch-manager': 'General',
  'security': 'General',
  'security-jobs-in-zimbabwe': 'General',
  'government': 'General',
  'local-government': 'General',
  'agriculture': 'General',
  'consultancy': 'General',
  'graduate-jobs-in-zimbabwe': 'General',
  'graduate-trainees': 'General',
  'internship': 'General',
  'attachment-jobs': 'General',
  'apprentice': 'General',
};

/** Adzuna category tag -> bracket. Tags verified against their ZA categories endpoint. */
export const ADZUNA_BRACKETS: Record<string, Bracket> = {
  'it-jobs': 'Software & IT',
  'accounting-finance-jobs': 'Finance & Accounting',
  'admin-jobs': 'Admin & Office',
  'hr-jobs': 'Admin & Office',
  'customer-services-jobs': 'Admin & Office',
  'sales-jobs': 'Sales & Marketing',
  'pr-advertising-marketing-jobs': 'Sales & Marketing',
  'creative-design-jobs': 'Sales & Marketing',
  'retail-jobs': 'Sales & Marketing',
  'engineering-jobs': 'Engineering & Technical',
  'trade-construction-jobs': 'Engineering & Technical',
  'manufacturing-jobs': 'Engineering & Technical',
  'maintenance-jobs': 'Engineering & Technical',
  'energy-oil-gas-jobs': 'Engineering & Technical',
  'scientific-qa-jobs': 'Engineering & Technical',
  'healthcare-nursing-jobs': 'Healthcare',
  'teaching-jobs': 'Education',
  'social-work-jobs': 'NGO & Development',
  'charity-voluntary-jobs': 'NGO & Development',
  'consultancy-jobs': 'NGO & Development',
  'logistics-warehouse-jobs': 'Logistics & Supply Chain',
  'travel-jobs': 'Hospitality & Tourism',
  'hospitality-catering-jobs': 'Hospitality & Tourism',
  'legal-jobs': 'Legal & Compliance',
  'property-jobs': 'General',
  'domestic-help-cleaning-jobs': 'General',
  'part-time-jobs': 'General',
  'other-general-jobs': 'General',
  unknown: 'General',
};

/**
 * Keyword -> bracket, applied to a job or résumé title. Used both to bracket
 * seniority-category jobs and as the first (free) pass at tagging a user.
 * Ordered longest-first at match time so "data scientist" wins over "data".
 */
export const TITLE_KEYWORDS: Array<[string, Bracket]> = [
  ['software develop', 'Software & IT'],
  ['software engineer', 'Software & IT'],
  ['web develop', 'Software & IT'],
  ['full stack', 'Software & IT'],
  ['frontend', 'Software & IT'],
  ['front end', 'Software & IT'],
  ['backend', 'Software & IT'],
  ['back end', 'Software & IT'],
  ['data scientist', 'Software & IT'],
  ['data analyst', 'Software & IT'],
  ['data engineer', 'Software & IT'],
  ['machine learning', 'Software & IT'],
  ['ai solutions', 'Software & IT'],
  ['ai engineer', 'Software & IT'],
  ['systems admin', 'Software & IT'],
  ['system admin', 'Software & IT'],
  ['network admin', 'Software & IT'],
  ['network engineer', 'Software & IT'],
  ['it support', 'Software & IT'],
  ['ict', 'Software & IT'],
  ['information technology', 'Software & IT'],
  ['cyber security', 'Software & IT'],
  ['cybersecurity', 'Software & IT'],
  ['devops', 'Software & IT'],
  ['database admin', 'Software & IT'],
  ['sap ', 'Software & IT'],
  ['programmer', 'Software & IT'],
  ['developer', 'Software & IT'],
  ['accountant', 'Finance & Accounting'],
  ['accounts ', 'Finance & Accounting'],
  ['accounting', 'Finance & Accounting'],
  ['finance', 'Finance & Accounting'],
  ['financial', 'Finance & Accounting'],
  ['audit', 'Finance & Accounting'],
  ['bookkeep', 'Finance & Accounting'],
  ['payroll', 'Finance & Accounting'],
  ['bank', 'Finance & Accounting'],
  ['insurance', 'Finance & Accounting'],
  ['actuar', 'Finance & Accounting'],
  ['tax ', 'Finance & Accounting'],
  ['administrat', 'Admin & Office'],
  ['secretar', 'Admin & Office'],
  ['receptionist', 'Admin & Office'],
  ['executive assistant', 'Admin & Office'],
  ['office assistant', 'Admin & Office'],
  ['human resource', 'Admin & Office'],
  ['recruit', 'Admin & Office'],
  ['clerk', 'Admin & Office'],
  ['data capture', 'Admin & Office'],
  ['marketing', 'Sales & Marketing'],
  ['sales', 'Sales & Marketing'],
  ['brand ', 'Sales & Marketing'],
  ['content creator', 'Sales & Marketing'],
  ['social media', 'Sales & Marketing'],
  ['graphic design', 'Sales & Marketing'],
  ['communication', 'Sales & Marketing'],
  ['public relations', 'Sales & Marketing'],
  ['journalist', 'Sales & Marketing'],
  ['merchandis', 'Sales & Marketing'],
  ['engineer', 'Engineering & Technical'],
  ['technician', 'Engineering & Technical'],
  ['electrician', 'Engineering & Technical'],
  ['electrical', 'Engineering & Technical'],
  ['mechatronic', 'Engineering & Technical'],
  ['millwright', 'Engineering & Technical'],
  ['draughtsman', 'Engineering & Technical'],
  ['quantity survey', 'Engineering & Technical'],
  ['mechanic', 'Engineering & Technical'],
  ['artisan', 'Engineering & Technical'],
  ['fitter', 'Engineering & Technical'],
  ['boilermaker', 'Engineering & Technical'],
  ['welder', 'Engineering & Technical'],
  ['surveyor', 'Engineering & Technical'],
  ['laboratory', 'Engineering & Technical'],
  ['quality assurance', 'Engineering & Technical'],
  ['nurse', 'Healthcare'],
  ['nursing', 'Healthcare'],
  ['doctor', 'Healthcare'],
  ['clinical', 'Healthcare'],
  ['pharmac', 'Healthcare'],
  ['medical', 'Healthcare'],
  ['health', 'Healthcare'],
  ['teacher', 'Education'],
  ['teaching', 'Education'],
  ['lecturer', 'Education'],
  ['tutor', 'Education'],
  ['academic', 'Education'],
  ['programme officer', 'NGO & Development'],
  ['project officer', 'NGO & Development'],
  ['monitoring and evaluation', 'NGO & Development'],
  ['ngo', 'NGO & Development'],
  ['humanitarian', 'NGO & Development'],
  ['community development', 'NGO & Development'],
  ['social work', 'NGO & Development'],
  ['logistic', 'Logistics & Supply Chain'],
  ['supply chain', 'Logistics & Supply Chain'],
  ['procurement', 'Logistics & Supply Chain'],
  ['warehouse', 'Logistics & Supply Chain'],
  ['driver', 'Logistics & Supply Chain'],
  ['fleet', 'Logistics & Supply Chain'],
  ['stores ', 'Logistics & Supply Chain'],
  ['chef', 'Hospitality & Tourism'],
  ['barista', 'Hospitality & Tourism'],
  ['barber', 'Hospitality & Tourism'],
  ['hairdress', 'Hospitality & Tourism'],
  ['waiter', 'Hospitality & Tourism'],
  ['hotel', 'Hospitality & Tourism'],
  ['hospitality', 'Hospitality & Tourism'],
  ['tourism', 'Hospitality & Tourism'],
  ['housekeep', 'Hospitality & Tourism'],
  ['legal', 'Legal & Compliance'],
  ['lawyer', 'Legal & Compliance'],
  ['attorney', 'Legal & Compliance'],
  ['compliance', 'Legal & Compliance'],
  ['paralegal', 'Legal & Compliance'],
  ['risk officer', 'Legal & Compliance'],
];

/**
 * Generic role words that describe grade rather than field. "Engineer" appears
 * in "Android Engineer" (software) and "Civil Engineer" (engineering), so a
 * match on one of these must NOT override the source's own category.
 */
const WEAK_KEYWORDS = new Set([
  'engineer',
  'technician',
  'administrat',
  'assistant',
  'clerk',
  'consultant',
  'specialist',
  'officer',
  'manager',
  'coordinator',
  'health',
  'ict',
  'sales',
  'media',
  'design',
  'brand ',
]);

/** Extra software terms, so language/framework titles don't fall to "engineer". */
const SOFTWARE_TERMS = [
  'android', 'ios develop', 'python', 'java ', 'javascript', 'typescript', '.net', 'c#',
  'angular', 'react', 'node js', 'nodejs', 'php', 'laravel', 'django', 'golang',
  'qa engineer', 'test engineer', 'automation engineer', 'cloud engineer', 'platform engineer',
  'aws', 'azure', 'kubernetes', 'sre', 'site reliability', 'mobile develop', 'software test',
];

const ALL_KEYWORDS: Array<[string, Bracket]> = [
  ...SOFTWARE_TERMS.map((t) => [t, 'Software & IT'] as [string, Bracket]),
  ...TITLE_KEYWORDS,
];

/** Longest first, so "data scientist" beats a bare "data". */
const SORTED_KEYWORDS = [...ALL_KEYWORDS].sort((a, b) => b[0].length - a[0].length);

function matches(haystack: string, needle: string): boolean {
  // Short keywords need word boundaries — otherwise "ict" matches "Victoria".
  if (needle.length <= 4 && !needle.includes(' ')) {
    return new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack);
  }
  return haystack.includes(needle);
}

export interface BracketGuess {
  bracket: Bracket;
  /** Weak guesses describe grade, not field, and lose to a source category. */
  strong: boolean;
  keyword: string;
}

export function guessBracket(text: string | null | undefined): BracketGuess | null {
  if (!text) return null;
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9&#.\s]/g, ' ').replace(/\s+/g, ' ')} `;
  for (const [needle, bracket] of SORTED_KEYWORDS) {
    if (matches(haystack, needle)) {
      return { bracket, strong: !WEAK_KEYWORDS.has(needle), keyword: needle };
    }
  }
  return null;
}

export function bracketFromText(text: string | null | undefined): Bracket | null {
  return guessBracket(text)?.bracket ?? null;
}

/**
 * A title describes the ROLE; a source category often describes the employer's
 * INDUSTRY. Prefer a confident title match, otherwise trust the category, and
 * fall back to a weak title match only when there is no category at all.
 */
export function resolveBracket(
  title: string | null | undefined,
  categoryBracket: Bracket | null
): Bracket {
  const guess = guessBracket(title);
  if (guess?.strong) return guess.bracket;
  if (categoryBracket) return categoryBracket;
  return guess?.bracket ?? DEFAULT_BRACKET;
}

const SENIORITY_PATTERNS: Array<[RegExp, string]> = [
  [/\b(intern|internship|attachment|apprentice)\b/i, 'INTERN'],
  [/\b(graduate trainee|graduate programme|graduate program|trainee)\b/i, 'GRADUATE'],
  [/\b(junior|entry.level|assistant)\b/i, 'JUNIOR'],
  [/\b(head of|chief|director|executive|general manager)\b/i, 'LEAD'],
  [/\b(senior|snr|lead|principal|manager|supervisor)\b/i, 'SENIOR'],
];

export function seniorityFromTitle(title: string | null | undefined): string | null {
  if (!title) return null;
  for (const [re, level] of SENIORITY_PATTERNS) {
    if (re.test(title)) return level;
  }
  return null;
}

const SENIORITY_ORDER = ['INTERN', 'GRADUATE', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'];

/** 1 for an exact level match, decaying with distance. Unknown levels are neutral. */
export function seniorityProximity(a: string | null, b: string | null): number {
  if (!a || !b) return 0.5;
  const ia = SENIORITY_ORDER.indexOf(a);
  const ib = SENIORITY_ORDER.indexOf(b);
  if (ia === -1 || ib === -1) return 0.5;
  return Math.max(0, 1 - Math.abs(ia - ib) / 3);
}
