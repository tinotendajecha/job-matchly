import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import type { Analysis } from '../types';

// ------------------ API helpers ------------------
export async function apiExportPdf(markdown: string) {
  const res = await fetch('/api/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown }),
  });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}

export async function apiParseResume(file: File, router: ReturnType<typeof useRouter>) {
  toast.success('Uploading your resume 🙃');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/parse-resume', { method: 'POST', body: fd });

  if (res.status === 402) {
    router.push('/pricing');
    throw new Error('You are out of credits.');
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to parse resume');
    return data;
  } else {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || 'Failed to parse resume');
  }
}

export async function apiNormalizeJDFromText(text: string) {
  const res = await fetch('/api/normalize-jd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to normalize JD');
  return res.json();
}

export async function apiAnalyze(resumeText: string, jdText: string) {
  toast.success('We are analyzing your resume 🙃');
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText, jdText }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Analyze failed');
  return res.json() as Promise<Analysis>;
}

export async function apiTailor(payload: { resumeJson: any; resumeText: string; jdText: string }) {
  const res = await fetch('/api/tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Tailor failed');
  return res.json() as Promise<{ ok: boolean; tailoredMarkdown: string }>;
}

export async function apiExportDocx(markdown: string) {
  const res = await fetch('/api/export/docx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown }),
  });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}

export async function handleExportDocxForCoverLetter(coverLetterTitle: string, markdown: string) {
  const res = await fetch('/api/export/docx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coverLetterTitle, markdown }),
  });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}
