/**
 * Parses a tailored resume markdown (as produced by the AI tailor prompt) into
 * builder-store-compatible state. Uses the utilities that already drive the
 * markdown preview so we stay consistent with the displayed format.
 *
 * Exact AI output format (from the tailor system prompt):
 *   # Full Name
 *   Professional Title
 *   Location · Phone · Email
 *
 *   ## Professional Summary
 *   ...
 *
 *   ## Skills
 *   **Technical/Hard Skills:** JS, TS, ...
 *   **Domain Expertise:** REST, ...
 *   **Soft Skills:** Leadership, ...
 *
 *   ## Experience
 *   **Job Title** — Company Name, Location (Start – End)
 *   - Achievement...
 *
 *   ## Education
 *   **Degree** — Institution, Location (Year)
 *
 *   ## Projects
 *   **Project Name** — link (optional)
 *   - Description
 *
 *   ## Certifications
 *   **Cert Name** — Issuer (Date)
 *
 *   ## References
 *   **Name** | Title | Company | contact
 */

import { extractTopHeader, splitByH2Sections } from '@/app/app/upload-tailor/helpers/utils';

// ── helpers ──────────────────────────────────────────────────────────────────

function stripBold(s: string): string {
  return s.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1').trim();
}

function isBullet(line: string): boolean {
  return /^[-*•]\s+/.test(line.trim());
}

function extractBullets(lines: string[]): string[] {
  return lines
    .filter(isBullet)
    .map((l) => l.trim().replace(/^[-*•]\s+/, '').trim())
    .filter(Boolean);
}

/** Split "Location · Phone · Email" into name-keyed fields */
function parseContactLine(contactLine: string) {
  const parts = contactLine
    .split(/\s*[·|]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  const email = parts.find((p) => p.includes('@')) ?? '';
  const phone =
    parts.find((p) => /^[+\d][\d\s\-().]{5,}$/.test(p)) ?? '';
  const website =
    parts.find((p) => /^(https?:\/\/|www\.)/i.test(p)) ?? '';
  const location =
    parts.find((p) => p !== email && p !== phone && p !== website) ?? '';

  return { email, phone, website, location };
}

/**
 * Split an experience/education content block into individual entry blocks.
 * Entries are separated by blank lines OR by a new bold-dash header line.
 * Returns an array of line arrays, one per entry.
 */
function splitEntryBlocks(content: string): string[][] {
  const lines = content.split(/\r?\n/);
  const blocks: string[][] = [];
  let current: string[] = [];

  const isEntryHeader = (line: string) =>
    // **Role** — Company ... (date) | Role — Company (date)
    /\*{0,2}.+\*{0,2}\s*[—–]\s*.+\(.+\)/.test(line) ||
    // ### Company heading
    /^###\s+/.test(line.trim());

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      // blank line = potential separator
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
      continue;
    }

    if (isEntryHeader(trimmed) && current.length > 0) {
      // New entry header encountered while we have content → flush
      blocks.push(current);
      current = [];
    }

    current.push(trimmed);
  }

  if (current.length > 0) blocks.push(current);
  return blocks.filter((b) => b.length > 0);
}

// ── section parsers ───────────────────────────────────────────────────────────

function parseSkills(content: string) {
  const technical: string[] = [];
  const soft: string[] = [];

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isSoftLine = /soft\s+skills?/i.test(trimmed);

    // Remove **Label:** prefix, then split by commas
    const valuesPart = trimmed
      .replace(/^\*{1,2}[^*]*\*{1,2}\s*:?\s*/, '') // strip **Label:**
      .replace(/^[-*•]\s+/, '')
      .trim();

    if (!valuesPart) continue;

    const skills = valuesPart.split(/\s*,\s*/).map(stripBold).filter(Boolean);

    if (isSoftLine) {
      soft.push(...skills);
    } else {
      technical.push(...skills);
    }
  }

  return { technical, soft };
}

function parseExperience(content: string) {
  const results: {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    achievements: string[];
  }[] = [];

  for (const block of splitEntryBlocks(content)) {
    const headerLine = block[0].replace(/^###\s+/, '').trim();
    const restLines = block.slice(1);

    // Pattern: **Role** — Company, Location (Start – End)
    //      or:  Role — Company (Start – End)
    const match = headerLine.match(
      /^(?:\*{1,2})?(.+?)(?:\*{1,2})?\s*[—–]\s*(.+?)\s*\(([^)]+)\)\s*$/
    );

    if (!match) {
      // If no match, try: ### Company heading with next line as role
      // (fallback: treat whole block as company name, skip)
      continue;
    }

    const role = stripBold(match[1]).trim();
    const companyFull = stripBold(match[2]).trim(); // "Company, Location" or "Company"
    const dateRange = match[3].trim();

    // Strip trailing location from company ("Tech Corp, New York" → "Tech Corp")
    const commaIdx = companyFull.lastIndexOf(',');
    const company =
      commaIdx > -1 ? companyFull.slice(0, commaIdx).trim() : companyFull;

    // "Jan 2020 – Present" or "2020 – 2022"
    const dateParts = dateRange.split(/\s*[–-]\s*/);
    const startDate = dateParts[0]?.trim() ?? '';
    const rawEnd = dateParts[1]?.trim() ?? '';
    const isCurrent = !rawEnd || /present|current|now/i.test(rawEnd);
    const endDate = isCurrent ? '' : rawEnd;

    const achievements = extractBullets(restLines);

    results.push({ role, company, startDate, endDate, isCurrent, achievements });
  }

  return results;
}

function parseEducation(content: string) {
  const results: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    graduationYear: string;
  }[] = [];

  for (const block of splitEntryBlocks(content)) {
    const headerLine = block[0].replace(/^###\s+/, '').trim();

    // **Degree in Field** — Institution, Location (Year)
    const match = headerLine.match(
      /^(?:\*{1,2})?(.+?)(?:\*{1,2})?\s*[—–]\s*(.+?)\s*\(([^)]+)\)\s*$/
    );

    if (match) {
      const rawDegree = stripBold(match[1]).trim();
      const institutionFull = stripBold(match[2]).trim();
      const year = match[3].trim();

      // "BSc in Computer Science" → degree="BSc", fieldOfStudy="Computer Science"
      const inMatch = rawDegree.match(/^(.+?)\s+in\s+(.+)$/i);
      const degree = inMatch ? inMatch[1].trim() : rawDegree;
      const fieldOfStudy = inMatch ? inMatch[2].trim() : '';

      const commaIdx = institutionFull.lastIndexOf(',');
      const institution =
        commaIdx > -1 ? institutionFull.slice(0, commaIdx).trim() : institutionFull;

      results.push({ institution, degree, fieldOfStudy, graduationYear: year });
      continue;
    }

    // Fallback: plain "School | Degree | Year" (pipe-separated)
    const pipeParts = headerLine.split('|').map((p) => stripBold(p).trim());
    if (pipeParts.length >= 2) {
      results.push({
        institution: pipeParts[0],
        degree: pipeParts[1] ?? '',
        fieldOfStudy: '',
        graduationYear: pipeParts[2] ?? '',
      });
    }
  }

  return results;
}

function parseProjects(content: string) {
  const results: {
    name: string;
    description: string;
    technologies: string[];
    url: string;
  }[] = [];

  for (const block of splitEntryBlocks(content)) {
    const headerLine = stripBold(block[0].replace(/^###\s+/, '')).trim();

    // Extract URL from header if present: "Project Name — https://..."
    const urlMatch = headerLine.match(/https?:\/\/\S+/);
    const url = urlMatch ? urlMatch[0] : '';
    const name = headerLine
      .replace(/\s*[—–]\s*https?:\/\/\S+/, '')
      .replace(/https?:\/\/\S+/, '')
      .trim();

    const restLines = block.slice(1);
    const bullets = extractBullets(restLines);

    // Non-bullet lines that aren't empty = prose description
    const prose = restLines
      .filter((l) => !isBullet(l) && l.trim())
      .map((l) => l.trim())
      .join(' ');

    const description = [prose, ...bullets].filter(Boolean).join('\n');

    // Technologies line: "**Technologies:** React, Node.js"
    const techLine = restLines.find((l) =>
      /technologies?|tech stack|built with/i.test(l)
    );
    const technologies = techLine
      ? techLine
          .replace(/\*{1,2}[^*]*\*{1,2}\s*:?\s*/g, '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    if (name) results.push({ name, description, technologies, url });
  }

  return results;
}

function parseCertifications(content: string) {
  const results: { name: string; issuer: string; date: string }[] = [];

  for (const block of splitEntryBlocks(content)) {
    // Strip bullet prefix so "- **Cert** — Issuer (Date)" and "**Cert** — Issuer (Date)" both work
    const headerLine = block[0].trim().replace(/^[-*•]\s+/, '');

    // **Cert Name** — Issuer (Date)  (also accepts plain hyphen instead of em-dash)
    const match = headerLine.match(
      /^(?:\*{1,2})?(.+?)(?:\*{1,2})?\s*[—–-]\s*(.+?)\s*\(([^)]*)\)\s*$/
    );
    if (match) {
      results.push({
        name: stripBold(match[1]).trim(),
        issuer: stripBold(match[2]).trim(),
        date: match[3].trim(),
      });
      continue;
    }

    // Pipe fallback: Name | Issuer | Date
    const pipeParts = headerLine.split('|').map((p) => stripBold(p).trim());
    if (pipeParts.length >= 2) {
      results.push({ name: pipeParts[0], issuer: pipeParts[1], date: pipeParts[2] ?? '' });
      continue;
    }

    // Plain name only (no issuer/date separator found)
    const plain = stripBold(headerLine).trim();
    if (plain) results.push({ name: plain, issuer: '', date: '' });
  }

  return results;
}

function parseReferences(content: string) {
  const results: {
    name: string;
    title: string;
    company: string;
    email: string;
    phone: string;
  }[] = [];

  for (const line of content.split(/\r?\n/)) {
    const trimmed = stripBold(line.trim()).replace(/^[-*•]\s+/, '');
    if (!trimmed) continue;

    // Prefer pipe-separated: Name | Title | Company | contact
    const pipeParts = trimmed.split('|').map((p) => p.trim()).filter(Boolean);
    if (pipeParts.length >= 2) {
      const contact = pipeParts[3] ?? '';
      results.push({
        name: pipeParts[0],
        title: pipeParts[1] ?? '',
        company: pipeParts[2] ?? '',
        email: contact.includes('@') ? contact : '',
        phone: !contact.includes('@') ? contact : '',
      });
      continue;
    }

    // Comma-separated fallback: Name, Title at Company, Relationship, Email/Phone
    // AI prompt uses this format: "Name, Title at Company, Relationship, contact"
    const commaParts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
    if (commaParts.length < 2) continue;

    const name = commaParts[0];
    // "Title at Company" → split on " at " to extract title and company
    const titleAtCompany = commaParts[1] ?? '';
    const atMatch = titleAtCompany.match(/^(.+?)\s+at\s+(.+)$/i);
    const title = atMatch ? atMatch[1].trim() : titleAtCompany;
    const company = atMatch ? atMatch[2].trim() : (commaParts[2] ?? '');
    // Last part that looks like a contact
    const contactCandidates = commaParts.slice(atMatch ? 2 : 3);
    const contact = contactCandidates.find((p) => p.includes('@') || /^[+\d]/.test(p)) ?? '';

    results.push({
      name,
      title,
      company,
      email: contact.includes('@') ? contact : '',
      phone: !contact.includes('@') ? contact : '',
    });
  }

  return results;
}

// ── main export ───────────────────────────────────────────────────────────────

export function parseTailoredMarkdownToBuilderState(markdown: string) {
  const { nameLine, professionalTitleLine, contactLine } = extractTopHeader(markdown);
  const contact = parseContactLine(contactLine);

  const sections = splitByH2Sections(markdown);

  const find = (pattern: RegExp) =>
    sections.find((s) => pattern.test(s.title))?.content ?? '';

  const summary = find(/professional\s+summary|summary/i);
  const skills = parseSkills(find(/skills?/i));
  const experience = parseExperience(find(/experience/i));
  const education = parseEducation(find(/education/i));
  const projects = parseProjects(find(/projects?/i));
  const certifications = parseCertifications(find(/certifications?/i));
  const references = parseReferences(find(/references?/i));

  const now = Date.now();

  return {
    header: {
      name: nameLine,
      title: professionalTitleLine,
      email: contact.email,
      phone: contact.phone,
      location: contact.location,
      website: contact.website,
    },

    professionalSummary: summary,

    skills,

    experience: experience.map((e, i) => ({
      id: `exp-md-${i}-${now}`,
      company: e.company,
      role: e.role,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      achievements: e.achievements,
    })),

    education: education.map((e, i) => ({
      id: `edu-md-${i}-${now}`,
      institution: e.institution,
      degree: e.degree,
      fieldOfStudy: e.fieldOfStudy,
      graduationYear: e.graduationYear,
    })),

    projects: projects.map((p, i) => ({
      id: `proj-md-${i}-${now}`,
      name: p.name,
      description: p.description,
      technologies: p.technologies,
      url: p.url,
    })),

    certifications: certifications.map((c, i) => ({
      id: `cert-md-${i}-${now}`,
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      expiryDate: '',
    })),

    references: references.map((r, i) => ({
      id: `ref-md-${i}-${now}`,
      name: r.name,
      title: r.title,
      company: r.company,
      email: r.email,
      phone: r.phone,
    })),

    changesSummary: '',
  };
}
