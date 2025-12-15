import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TailorTemplateId } from '../types';
import { TwoColumnPreview } from '../templates/TwoColumnPreview';
import { ClassicPreview } from '../templates/Classic';

// markdown helpers
export function splitChanges(md: string) {
  if (!md) return { body: '', changes: '' };
  const m = md.match(/^##\s*Changes\s+Summary\s*$/mi);
  if (!m) return { body: md, changes: '' };
  const [pre, ...rest] = md.split(/^##\s*Changes\s+Summary\s*$/mi);
  return { body: pre.trim(), changes: rest.join('\n').trim() };
}

export function flatten(children: any): string {
  if (Array.isArray(children)) return children.map(flatten).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (children && typeof children === 'object' && 'props' in children) {
    return flatten((children as any).props?.children);
  }
  return '';
}

// Pull "# Name" and the next line "Location · Phone · Email" if present.
// Return them + the remaining markdown body.
export function extractTopHeader(md: string) {
  const lines = (md || '').split(/\r?\n/);

  const h1Index = lines.findIndex((l) => l.trim().startsWith('# '));
  if (h1Index === -1) {
    return { nameLine: '', professionalTitleLine: '', contactLine: '', rest: md };
  }

  const nameLine = lines[h1Index].replace(/^#\s+/, '').trim();
  const professionalTitleLine = (lines[h1Index + 1] || '').trim();
  const contactLine = (lines[h1Index + 2] || '').trim();

  // Remove the three header lines
  const rest = [...lines.slice(0, h1Index), ...lines.slice(h1Index + 3)].join('\n').trim();

  return { nameLine, professionalTitleLine, contactLine, rest };
}


// Extract all H2 headings (## Something) in order.
// Excludes "Changes Summary" because you already split it for UI.
export function getH2Headings(md: string) {
  const out: string[] = [];
  const re = /^##\s+(.+)\s*$/gm;
  let m: RegExpExecArray | null;

  while ((m = re.exec(md)) !== null) {
    const title = (m[1] || '').trim();
    if (!title) continue;
    if (/^changes\s+summary$/i.test(title)) continue;
    out.push(title);
  }

  // de-dupe while preserving order
  return Array.from(new Set(out));
}

type MarkdownPreviewProps = {
  value: string;
  templateId: TailorTemplateId;
};

export type MdSection = {
  title: string;
  content: string; // markdown content without the "## Title" line
};

export function splitByH2Sections(md: string): MdSection[] {
  const lines = (md || "").split(/\r?\n/);

  const sections: MdSection[] = [];
  let currentTitle: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (!currentTitle) return;
    const content = buf.join("\n").trim();
    sections.push({ title: currentTitle, content });
    buf = [];
  };

  for (const line of lines) {
    const m = line.match(/^##\s+(.+)\s*$/);
    if (m) {
      flush();
      currentTitle = (m[1] || "").trim();
      continue;
    }
    if (currentTitle) buf.push(line);
  }
  flush();

  // Remove Changes Summary + empty sections
  return sections.filter(
    (s) => s.content && !/^changes\s+summary$/i.test(s.title.trim())
  );
}


export const MarkdownPreview = ({ value, templateId }: MarkdownPreviewProps) => {
  if (!value) return null;

  if (templateId === 'twoColumn') {
    return <TwoColumnPreview value={value} />;
  }

  // default = classic
  return <ClassicPreview value={value} />;
};


