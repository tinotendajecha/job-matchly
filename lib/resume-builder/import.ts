import type { ResumeJson } from '@/lib/types';

function isCurrentJob(end: string): boolean {
  if (!end) return true;
  const lower = end.toLowerCase().trim();
  return lower === 'present' || lower === 'current' || lower === 'now' || lower === '-';
}

export function resumeJsonToBuilderState(json: ResumeJson) {
  return {
    header: {
      name: json.name ?? '',
      title: json.headline ?? '',
      email: json.email ?? '',
      phone: json.phone ?? '',
      location: json.location ?? '',
      website: json.website ?? '',
    },

    professionalSummary: json.summary ?? '',

    skills: {
      technical: Array.isArray(json.skills) ? json.skills : [],
      soft: [] as string[],
    },

    experience: (json.experience ?? []).map((exp, i) => ({
      id: `exp-import-${i}-${Date.now()}`,
      company: exp.company ?? '',
      role: exp.role ?? '',
      startDate: exp.start ?? '',
      endDate: isCurrentJob(exp.end) ? '' : (exp.end ?? ''),
      isCurrent: isCurrentJob(exp.end),
      achievements: Array.isArray(exp.bullets) ? exp.bullets : [],
    })),

    education: (json.education ?? []).map((edu, i) => ({
      id: `edu-import-${i}-${Date.now()}`,
      institution: edu.school ?? '',
      degree: edu.degree ?? '',
      fieldOfStudy: '',
      graduationYear: edu.year ?? '',
    })),

    projects: (json.projects ?? []).map((proj, i) => ({
      id: `proj-import-${i}-${Date.now()}`,
      name: proj.name ?? '',
      description: [proj.summary, ...(proj.bullets ?? [])].filter(Boolean).join('\n'),
      technologies: [] as string[],
      url: proj.link ?? '',
    })),

    certifications: [] as {
      id: string; name: string; issuer: string; date: string; expiryDate?: string;
    }[],

    references: (json.references ?? []).map((ref, i) => {
      const contact = ref.contact ?? '';
      const isEmail = contact.includes('@');
      return {
        id: `ref-import-${i}-${Date.now()}`,
        name: ref.name ?? '',
        title: ref.title ?? '',
        company: ref.company ?? '',
        email: isEmail ? contact : '',
        phone: isEmail ? '' : contact,
      };
    }),

    changesSummary: '',
  };
}
