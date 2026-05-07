'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { useCreateResumeStore } from '@/lib/zustand/store';
import { resumeDataToPreviewHtml } from '../lib/export-utils';

interface ResumePreviewProps {
  zoom: number;
  activeTemplate: 'classic' | 'modern';
}

// A4 at 96 DPI
const A4_W = 794;   // 210mm
const A4_H = 1123;  // 297mm
const PG_GAP = 20;  // margin-bottom on each .rp page
const PAD = 52;     // #pages top(20) + bottom(32)

export function ResumePreview({ zoom, activeTemplate }: ResumePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const header = useCreateResumeStore((s) => s.header);
  const professionalSummary = useCreateResumeStore((s) => s.professionalSummary);
  const skills = useCreateResumeStore((s) => s.skills);
  const experience = useCreateResumeStore((s) => s.experience);
  const education = useCreateResumeStore((s) => s.education);
  const projects = useCreateResumeStore((s) => s.projects);
  const certifications = useCreateResumeStore((s) => s.certifications);
  const references = useCreateResumeStore((s) => s.references);
  const changesSummary = useCreateResumeStore((s) => s.changesSummary);

  const resumeData = useMemo(() => ({
    header, professionalSummary, skills, experience,
    education, projects, certifications, references, changesSummary,
  }), [header, professionalSummary, skills, experience, education, projects, certifications, references, changesSummary]);

  const htmlContent = useMemo(
    () => resumeDataToPreviewHtml(resumeData, activeTemplate),
    [resumeData, activeTemplate]
  );

  // Receive page count from iframe pagination script
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'resumePages' && typeof ev.data.count === 'number') {
        setPageCount(ev.data.count);
        setCurrentPage(1);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Track which page is currently visible based on scroll position in the outer container
  const outerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const onScroll = () => {
      const scale = zoom / 100;
      const pageHeightScaled = (A4_H + PG_GAP) * scale;
      const scrollTop = el.scrollTop;
      const topPad = 20 * scale; // #pages padding-top scaled
      const page = Math.min(pageCount, Math.max(1, Math.floor((scrollTop - topPad) / pageHeightScaled) + 1));
      setCurrentPage(page);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [pageCount, zoom]);

  // Scroll to a given page inside the outer container
  const goToPage = (p: number) => {
    const el = outerRef.current;
    if (!el) return;
    const scale = zoom / 100;
    const topPad = 20 * scale;
    const pageHeightScaled = (A4_H + PG_GAP) * scale;
    el.scrollTo({ top: topPad + (p - 1) * pageHeightScaled, behavior: 'smooth' });
  };

  // Total iframe height based on page count
  const iframeHeight = pageCount * (A4_H + PG_GAP) + PAD;

  const scale = zoom / 100;

  return (
    <div ref={outerRef} className="flex-1 overflow-auto bg-[#e8eaed] relative">
      {/* Scaled page stack */}
      <div className="flex justify-center">
        <div
          style={{
            width: A4_W * scale,
            height: iframeHeight * scale,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: A4_W,
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              title="Resume Preview"
              style={{
                width: A4_W,
                height: iframeHeight,
                border: 'none',
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>

      {/* Page indicator pill — fixed in the bottom-right of the preview panel */}
      <div className="sticky bottom-4 z-10 flex justify-end pr-5 pointer-events-none mt-[-40px]">
        <div className="flex items-center gap-1 bg-black/75 text-white rounded-full shadow-lg pointer-events-auto select-none">
          <button
            className="px-2 py-1.5 text-sm disabled:opacity-30 hover:bg-white/10 rounded-full transition-colors"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous page"
          >
            ‹
          </button>
          <span className="text-[13px] font-medium px-1 tabular-nums">
            {currentPage} / {pageCount}
          </span>
          <button
            className="px-2 py-1.5 text-sm disabled:opacity-30 hover:bg-white/10 rounded-full transition-colors"
            disabled={currentPage >= pageCount}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
