'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export type SelectableTemplateId = 'classic' | 'modern';

// ─── Dynamic scale wrapper (same approach as /templates page) ────────────────
function TemplatePreview({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 794);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ aspectRatio: '8.5/11', background: '#fff', position: 'relative', overflow: 'hidden', width: '100%' }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '794px',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Classic preview ──────────────────────────────────────────────────────────
function ClassicPreview() {
  return (
    <div style={{ width: '794px', background: '#fff', color: '#111827', fontFamily: "'Georgia','Times New Roman',serif", padding: '52px 56px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#111827', letterSpacing: '0.02em' }}>John Kamau</div>
        <div style={{ fontSize: '14px', color: '#4B5563', marginTop: '5px', fontStyle: 'italic' }}>Senior Software Engineer</div>
        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span>john.kamau@gmail.com</span><span>·</span><span>+254 722 000 123</span><span>·</span><span>Nairobi, Kenya</span>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #D1D5DB', marginBottom: '20px' }} />
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Professional Summary</div>
        <div style={{ fontSize: '11.5px', color: '#374151', lineHeight: '1.65' }}>Results-driven Software Engineer with 4+ years of experience designing and building scalable web applications. Adept at leading cross-functional teams and delivering high-quality solutions on time.</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Experience</div>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <div><span style={{ fontSize: '12px', fontWeight: 700 }}>Senior Software Developer</span><span style={{ fontSize: '11.5px', color: '#4B5563' }}> — MTN Digital Labs</span></div>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>Jan 2022 – Present</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
            <li>Engineered core payment API handling 50K+ daily transactions with 99.9% uptime</li>
            <li>Reduced system latency by 38% through advanced query optimisation and caching</li>
          </ul>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <div><span style={{ fontSize: '12px', fontWeight: 700 }}>Junior Developer</span><span style={{ fontSize: '11.5px', color: '#4B5563' }}> — TechBridge Africa</span></div>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>Mar 2020 – Dec 2021</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
            <li>Built RESTful APIs for mobile banking platform used by 200K+ users</li>
          </ul>
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Education</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: '12px', fontWeight: 700 }}>BSc Computer Science</div><div style={{ fontSize: '11px', color: '#4B5563' }}>University of Nairobi</div></div>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>2020</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Skills</div>
        <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.8' }}>
          <span style={{ fontWeight: 600 }}>Technical: </span>Python · JavaScript · TypeScript · React · Node.js · PostgreSQL · Docker · AWS
        </div>
        <div style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>
          <span style={{ fontWeight: 600 }}>Soft Skills: </span>Leadership · Communication · Problem Solving · Agile Methodology
        </div>
      </div>
    </div>
  );
}

// ─── Modern preview ───────────────────────────────────────────────────────────
function ModernPreview() {
  const blue = '#2563EB';
  const pill = { display: 'inline-block' as const, background: '#EFF6FF', color: '#1D4ED8', fontSize: '10px', fontWeight: 600, padding: '2px 9px', borderRadius: '4px', marginRight: '5px', marginBottom: '4px' };
  return (
    <div style={{ width: '794px', background: '#fff', color: '#111827', fontFamily: 'system-ui,-apple-system,sans-serif', padding: '48px 52px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: blue, letterSpacing: '-0.01em' }}>Aisha Diallo</div>
        <div style={{ fontSize: '15px', color: '#4B5563', marginTop: '4px' }}>Product Designer</div>
        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>aisha@creative.io</span><span>·</span><span>+234 901 234 567</span><span>·</span><span>Lagos, Nigeria</span>
        </div>
      </div>
      <div style={{ borderTop: `2px solid ${blue}`, marginBottom: '20px' }} />
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: blue, borderBottom: `2px solid ${blue}`, paddingBottom: '4px', marginBottom: '10px' }}>Professional Summary</div>
        <div style={{ fontSize: '11.5px', color: '#374151', lineHeight: '1.65' }}>Creative and detail-oriented Product Designer with 5+ years crafting intuitive digital experiences for fintech and e-commerce platforms across West Africa.</div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: blue, borderBottom: `2px solid ${blue}`, paddingBottom: '4px', marginBottom: '10px' }}>Skills</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Technical</div>
            <div>{['Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'Framer'].map(s => <span key={s} style={pill}>{s}</span>)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Soft Skills</div>
            <div>{['Leadership', 'Agile', 'User Research', 'Storytelling'].map(s => <span key={s} style={pill}>{s}</span>)}</div>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: blue, borderBottom: `2px solid ${blue}`, paddingBottom: '4px', marginBottom: '10px' }}>Experience</div>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <div><span style={{ fontSize: '12.5px', fontWeight: 700 }}>Lead Product Designer</span><span style={{ fontSize: '11.5px', color: '#4B5563' }}> — Flutterwave</span></div>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>2022 – Present</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
            <li>Redesigned onboarding flow, boosting activation rate by 35%</li>
            <li>Built and maintained a design system adopted across 5 products</li>
          </ul>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <div><span style={{ fontSize: '12.5px', fontWeight: 700 }}>UI/UX Designer</span><span style={{ fontSize: '11.5px', color: '#4B5563' }}> — Andela</span></div>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>2019 – 2022</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
            <li>Delivered 12+ end-to-end product designs for global SaaS clients</li>
          </ul>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: blue, borderBottom: `2px solid ${blue}`, paddingBottom: '4px', marginBottom: '10px' }}>Education</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: '12px', fontWeight: 700 }}>BA Visual Arts & Design</div><div style={{ fontSize: '11px', color: '#4B5563' }}>University of Lagos</div></div>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>2019</span>
        </div>
      </div>
    </div>
  );
}

// ─── Two Column preview ───────────────────────────────────────────────────────
function TwoColumnPreview() {
  const orange = '#f97316';
  const dark = '#111827';
  const muted = '#6B7280';
  const shortRule = { width: '48px', borderTop: `2px solid ${dark}`, marginBottom: '8px' };
  const rule = { borderTop: `2px solid ${dark}`, marginBottom: '10px' };
  return (
    <div style={{ width: '794px', background: '#fff', color: dark, fontFamily: 'system-ui,-apple-system,sans-serif', padding: '44px 48px 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '0 40px' }}>
        <div style={{ paddingTop: '4px' }}>
          <div style={{ fontSize: '44px', fontWeight: 900, lineHeight: 1.02, color: dark, letterSpacing: '-0.02em' }}>Kwame<br />Asante</div>
          <div style={{ marginTop: '10px', fontSize: '20px', fontWeight: 700, color: orange, lineHeight: 1.3 }}>Full-Stack Engineer</div>
        </div>
        <div style={{ paddingTop: '4px' }}>
          <div style={{ borderTop: `3px solid ${dark}`, marginBottom: '14px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: dark, marginBottom: '6px' }}>Kwame Asante</div>
          <div style={{ fontSize: '11px', lineHeight: '1.9', color: muted }}>
            <div style={{ color: orange }}>kwame.asante@gmail.com</div>
            <div style={{ color: orange }}>+233 550 100 200</div>
            <div>Accra, Ghana</div>
            <div>github.com/kwameasante</div>
          </div>
        </div>
        <div style={{ paddingTop: '20px' }}>
          <div style={shortRule} />
          <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Experience</div>
        </div>
        <div style={{ paddingTop: '20px' }}>
          <div style={rule} />
          <div style={{ marginBottom: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>Senior Full-Stack Developer</div>
              <div style={{ fontSize: '10px', color: muted }}>2022 – Present</div>
            </div>
            <div style={{ fontSize: '11px', color: muted, marginBottom: '5px' }}>Paystack · Accra</div>
            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10.5px', color: '#374151', lineHeight: '1.75' }}>
              <li>Built payment APIs handling 300K+ daily transactions</li>
              <li>Reduced frontend load time by 52% via code splitting</li>
            </ul>
          </div>
        </div>
        <div style={{ paddingTop: '18px' }}>
          <div style={shortRule} />
          <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Skills</div>
        </div>
        <div style={{ paddingTop: '18px' }}>
          <div style={rule} />
          <div style={{ fontSize: '10.5px', color: '#374151', lineHeight: '1.85' }}>
            <span style={{ fontWeight: 700, color: dark }}>Languages: </span>TypeScript · Python · Go · SQL<br />
            <span style={{ fontWeight: 700, color: dark }}>Frontend: </span>React · Next.js · Tailwind CSS<br />
            <span style={{ fontWeight: 700, color: dark }}>Backend: </span>Node.js · FastAPI · PostgreSQL · Redis
          </div>
        </div>
        <div style={{ paddingTop: '18px' }}>
          <div style={shortRule} />
          <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Education</div>
        </div>
        <div style={{ paddingTop: '18px' }}>
          <div style={rule} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700 }}>BSc Computer Science</div>
              <div style={{ fontSize: '11px', color: muted }}>University of Ghana · Legon</div>
            </div>
            <div style={{ fontSize: '10px', color: muted }}>2020</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template data ────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'classic' as const,
    name: 'Classic',
    tag: 'Professional',
    accentColor: '#374151',
    description: 'Clean ATS-friendly layout with subtle dividers and easy scanning.',
    selectable: true,
    actionLabel: 'Use Template',
    preview: <ClassicPreview />,
  },
  {
    id: 'modern' as const,
    name: 'Modern',
    tag: 'Trending',
    accentColor: '#2563EB',
    description: 'Bold blue accents and modern typography. Stands out while staying ATS-friendly.',
    selectable: true,
    actionLabel: 'Use Template',
    preview: <ModernPreview />,
  },
  {
    id: 'two-column' as const,
    name: 'Two Column',
    tag: 'Bold',
    accentColor: '#f97316',
    description: 'Editorial two-column layout with bold typography and orange accents.',
    selectable: false,
    actionLabel: 'Tailor with This Style',
    href: '/app/upload-tailor',
    preview: <TwoColumnPreview />,
  },
];

// ─── Dialog ───────────────────────────────────────────────────────────────────
interface TemplateBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: SelectableTemplateId) => void;
}

export function TemplateBrowserDialog({ open, onOpenChange, onSelectTemplate }: TemplateBrowserDialogProps) {
  const router = useRouter();

  const handleAction = (t: typeof TEMPLATES[number]) => {
    if (t.selectable) {
      onSelectTemplate(t.id as SelectableTemplateId);
    } else if (t.href) {
      router.push(t.href);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        [&>button:last-child]:hidden — removes the shadcn/ui auto-generated close button
        that's always appended as the last child of DialogContent.
        We render our own X in the header instead.
      */}
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-3xl lg:max-w-5xl h-[90vh] p-0 overflow-hidden gap-0 flex flex-col [&>button:last-child]:hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 text-left">
              <DialogTitle className="text-xl font-semibold">Explore Templates</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground/90">
                Tap a design to instantly apply it to your resume.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                className="group relative flex flex-col rounded-xl border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 bg-card"
              >
                {/* Accent bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 z-10" style={{ background: t.accentColor }} />

                {/* Preview area */}
                <div className="relative overflow-hidden border-b border-border/40 bg-white">
                  <TemplatePreview>{t.preview}</TemplatePreview>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shadow-lg font-medium"
                      onClick={() => handleAction(t)}
                    >
                      {t.actionLabel}
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-base">{t.name}</h4>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${t.accentColor}18`, color: t.accentColor }}
                    >
                      {t.tag}
                    </span>
                    {!t.selectable && (
                      <Badge variant="secondary" className="text-[10px] ml-auto">Builder coming soon</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">{t.description}</p>
                  <Button
                    size="sm"
                    className="w-full font-medium"
                    variant={t.selectable ? 'default' : 'outline'}
                    onClick={() => handleAction(t)}
                  >
                    {t.actionLabel}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
