'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type TemplateId = 'classic' | 'modern' | 'two-column';

const templates: Array<{
  id: TemplateId;
  name: string;
  description: string;
  features: string[];
  popular: boolean;
  accentColor: string;
  tag: string;
  cta: string;
  href: string;
}> = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean and professional design that passes all ATS systems. Trusted by HR professionals globally.',
    features: ['ATS-optimized', 'Single column', 'Conservative styling', 'Universal compatibility'],
    popular: false,
    accentColor: '#374151',
    tag: 'Professional',
    cta: 'Use This Template',
    href: '/app/builder/classic',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold and creative layout with blue accents. Stand out while staying ATS-friendly.',
    features: ['Eye-catching design', 'Blue color accents', 'Modern typography', 'Skill badges'],
    popular: true,
    accentColor: '#2563EB',
    tag: 'Trending',
    cta: 'Use This Template',
    href: '/app/builder/modern',
  },
  {
    id: 'two-column',
    name: 'Two Column',
    description: 'Editorial two-column layout with bold typography and orange accents. Makes a powerful first impression.',
    features: ['Two-column layout', 'Orange accents', 'Extrabold typography', 'Upload & Tailor output'],
    popular: false,
    accentColor: '#f97316',
    tag: 'Bold',
    cta: 'Tailor with This Style',
    href: '/app/upload-tailor',
  },
];

// ─── Dynamic scale wrapper ────────────────────────────────────────────────────
function TemplatePreview({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

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

// ─── Classic template preview (black / gray, thin dividers) ──────────────────
function ClassicResumePreview() {
  return (
    <div style={{ width: '794px', background: '#fff', color: '#111827', fontFamily: "'Georgia', 'Times New Roman', serif", padding: '52px 56px 40px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#111827', letterSpacing: '0.02em' }}>John Kamau</div>
        <div style={{ fontSize: '14px', color: '#4B5563', marginTop: '5px', fontStyle: 'italic' }}>Senior Software Engineer</div>
        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span>john.kamau@gmail.com</span>
          <span>·</span>
          <span>+254 722 000 123</span>
          <span>·</span>
          <span>Nairobi, Kenya</span>
          <span>·</span>
          <span>linkedin.com/in/johnkamau</span>
        </div>
      </div>

      {/* Divider — thin gray */}
      <div style={{ borderTop: '1px solid #D1D5DB', marginBottom: '20px' }} />

      {/* Summary */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Professional Summary
        </div>
        <div style={{ fontSize: '11.5px', color: '#374151', lineHeight: '1.65' }}>
          Results-driven Software Engineer with 4+ years of experience designing and building scalable web applications.
          Adept at leading cross-functional teams and delivering high-quality solutions on time. Passionate about
          clean architecture, performance optimisation, and mentoring junior engineers.
        </div>
      </div>

      {/* Experience */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Experience
        </div>
        {/* Job 1 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>Senior Software Developer</span>
              <span style={{ fontSize: '11.5px', color: '#4B5563' }}> — MTN Digital Labs</span>
            </div>
            <span style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>Jan 2022 – Present</span>
          </div>
          <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
            <li>Engineered core payment API handling 50K+ daily transactions with 99.9% uptime</li>
            <li>Reduced system latency by 38% through advanced query optimisation and caching</li>
            <li>Led a team of 4 engineers across 3 product squads, conducting weekly code reviews</li>
          </ul>
        </div>
        {/* Job 2 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>Junior Developer</span>
              <span style={{ fontSize: '11.5px', color: '#4B5563' }}> — TechBridge Africa</span>
            </div>
            <span style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>Mar 2020 – Dec 2021</span>
          </div>
          <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
            <li>Built RESTful APIs for the company's mobile banking platform used by 200K+ users</li>
            <li>Collaborated with product and design teams to implement UX improvements</li>
          </ul>
        </div>
      </div>

      {/* Education */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Education
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>BSc Computer Science</div>
            <div style={{ fontSize: '11px', color: '#4B5563' }}>University of Nairobi</div>
          </div>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>2020</span>
        </div>
      </div>

      {/* Skills */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Skills
        </div>
        <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.8' }}>
          <span style={{ color: '#111827', fontWeight: 600 }}>Technical: </span>
          Python · JavaScript · TypeScript · React · Node.js · PostgreSQL · Docker · AWS
        </div>
        <div style={{ fontSize: '11px', color: '#374151', marginTop: '4px' }}>
          <span style={{ color: '#111827', fontWeight: 600 }}>Soft Skills: </span>
          Leadership · Communication · Problem Solving · Agile Methodology
        </div>
      </div>
    </div>
  );
}

// ─── Modern template preview (blue accents, section underlines, badge pills) ─
function ModernResumePreview() {
  const blue = '#2563EB';
  const pill = { display: 'inline-block', background: '#EFF6FF', color: '#1D4ED8', fontSize: '10px', fontWeight: 600, padding: '2px 9px', borderRadius: '4px', marginRight: '5px', marginBottom: '4px' };

  return (
    <div style={{ width: '794px', background: '#fff', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '48px 52px 40px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: blue, letterSpacing: '-0.01em' }}>Aisha Diallo</div>
        <div style={{ fontSize: '15px', color: '#4B5563', marginTop: '4px' }}>Product Designer</div>
        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>aisha@creative.io</span>
          <span>·</span>
          <span>+234 901 234 567</span>
          <span>·</span>
          <span>Lagos, Nigeria</span>
          <span>·</span>
          <span>dribbble.com/aisha</span>
        </div>
      </div>

      {/* Bold blue divider */}
      <div style={{ borderTop: `2px solid ${blue}`, marginBottom: '20px' }} />

      {/* Summary */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: blue, borderBottom: `2px solid ${blue}`, paddingBottom: '4px', marginBottom: '10px' }}>
          Professional Summary
        </div>
        <div style={{ fontSize: '11.5px', color: '#374151', lineHeight: '1.65' }}>
          Creative and detail-oriented Product Designer with 5+ years crafting intuitive digital experiences
          for fintech and e-commerce platforms across West Africa. Expert at bridging user needs with business
          goals through research-driven design and rapid prototyping.
        </div>
      </div>

      {/* Skills with badge pills */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: blue, borderBottom: `2px solid ${blue}`, paddingBottom: '4px', marginBottom: '10px' }}>
          Skills
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Technical</div>
            <div>
              {['Figma', 'Sketch', 'Adobe XD', 'Prototyping', 'HTML/CSS', 'Framer'].map(s => (
                <span key={s} style={pill}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Soft Skills</div>
            <div>
              {['Leadership', 'Agile', 'User Research', 'Storytelling', 'Workshops'].map(s => (
                <span key={s} style={pill}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Experience */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: blue, borderBottom: `2px solid ${blue}`, paddingBottom: '4px', marginBottom: '10px' }}>
          Experience
        </div>
        {/* Job 1 */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <div>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#111827' }}>Lead Product Designer</span>
              <span style={{ fontSize: '11.5px', color: '#4B5563' }}> — Flutterwave</span>
            </div>
            <span style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>2022 – Present</span>
          </div>
          <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
            <li>Redesigned onboarding flow, boosting activation rate by 35% and reducing drop-off by 22%</li>
            <li>Built and maintained a design system adopted across 5 products and 12 engineers</li>
            <li>Facilitated user research sessions across 3 African markets to validate product decisions</li>
          </ul>
        </div>
        {/* Job 2 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <div>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#111827' }}>UI/UX Designer</span>
              <span style={{ fontSize: '11.5px', color: '#4B5563' }}> — Andela</span>
            </div>
            <span style={{ fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap' }}>2019 – 2022</span>
          </div>
          <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '11px', color: '#374151', lineHeight: '1.7' }}>
            <li>Delivered 12+ end-to-end product designs for global SaaS clients</li>
            <li>Improved CSAT scores by 28% through iterative design and usability testing</li>
          </ul>
        </div>
      </div>

      {/* Education */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: blue, borderBottom: `2px solid ${blue}`, paddingBottom: '4px', marginBottom: '10px' }}>
          Education
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>BA Visual Arts & Design</div>
            <div style={{ fontSize: '11px', color: '#4B5563' }}>University of Lagos</div>
          </div>
          <span style={{ fontSize: '11px', color: '#6B7280' }}>2019</span>
        </div>
      </div>
    </div>
  );
}

// ─── Two Column template preview (orange accent, 2-col editorial layout) ─────
function TwoColumnResumePreview() {
  const orange = '#f97316';
  const dark = '#111827';
  const muted = '#6B7280';
  const rule = { borderTop: `2px solid ${dark}`, marginBottom: '10px' };
  const shortRule = { width: '48px', borderTop: `2px solid ${dark}`, marginBottom: '8px' };

  return (
    <div style={{ width: '794px', background: '#fff', color: dark, fontFamily: 'system-ui, -apple-system, sans-serif', padding: '44px 48px 40px' }}>
      {/* Two-column grid header */}
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '0 40px' }}>

        {/* TOP LEFT — big name + orange title */}
        <div style={{ paddingTop: '4px' }}>
          <div style={{ fontSize: '44px', fontWeight: 900, lineHeight: 1.02, color: dark, letterSpacing: '-0.02em' }}>
            Kwame<br />Asante
          </div>
          <div style={{ marginTop: '10px', fontSize: '20px', fontWeight: 700, color: orange, lineHeight: 1.3 }}>
            Full-Stack Engineer
          </div>
        </div>

        {/* TOP RIGHT — contact block */}
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

        {/* EXPERIENCE */}
        <div style={{ paddingTop: '20px' }}>
          <div style={shortRule} />
          <div style={{ fontSize: '13px', fontWeight: 900, color: dark, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Experience</div>
        </div>
        <div style={{ paddingTop: '20px' }}>
          <div style={rule} />
          {/* Job 1 */}
          <div style={{ marginBottom: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: dark }}>Senior Full-Stack Developer</div>
              <div style={{ fontSize: '10px', color: muted, whiteSpace: 'nowrap' }}>2022 – Present</div>
            </div>
            <div style={{ fontSize: '11px', color: muted, marginBottom: '5px' }}>Paystack · Accra</div>
            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10.5px', color: '#374151', lineHeight: '1.75' }}>
              <li>Built high-throughput payment APIs handling 300K+ daily transactions</li>
              <li>Reduced frontend load time by 52% via code splitting and CDN optimisation</li>
              <li>Led migration from monolith to microservices for 3 core products</li>
            </ul>
          </div>
          {/* Job 2 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: dark }}>Software Engineer</div>
              <div style={{ fontSize: '10px', color: muted, whiteSpace: 'nowrap' }}>2020 – 2022</div>
            </div>
            <div style={{ fontSize: '11px', color: muted, marginBottom: '5px' }}>Andela · Remote</div>
            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10.5px', color: '#374151', lineHeight: '1.75' }}>
              <li>Delivered full-stack features for 5 enterprise clients across US and Europe</li>
              <li>Improved test coverage from 42% to 91% over two quarters</li>
            </ul>
          </div>
        </div>

        {/* SKILLS */}
        <div style={{ paddingTop: '18px' }}>
          <div style={shortRule} />
          <div style={{ fontSize: '13px', fontWeight: 900, color: dark, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Skills</div>
        </div>
        <div style={{ paddingTop: '18px' }}>
          <div style={rule} />
          <div style={{ fontSize: '10.5px', color: '#374151', lineHeight: '1.85' }}>
            <span style={{ fontWeight: 700, color: dark }}>Languages: </span>TypeScript · Python · Go · SQL<br />
            <span style={{ fontWeight: 700, color: dark }}>Frontend: </span>React · Next.js · Tailwind CSS · Figma<br />
            <span style={{ fontWeight: 700, color: dark }}>Backend: </span>Node.js · FastAPI · PostgreSQL · Redis<br />
            <span style={{ fontWeight: 700, color: dark }}>DevOps: </span>Docker · AWS · GitHub Actions · Terraform
          </div>
        </div>

        {/* EDUCATION */}
        <div style={{ paddingTop: '18px' }}>
          <div style={shortRule} />
          <div style={{ fontSize: '13px', fontWeight: 900, color: dark, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Education</div>
        </div>
        <div style={{ paddingTop: '18px' }}>
          <div style={rule} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: dark }}>BSc Computer Science</div>
              <div style={{ fontSize: '11px', color: muted }}>University of Ghana · Legon</div>
            </div>
            <div style={{ fontSize: '10px', color: muted }}>2020</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const router = useRouter();

  const handleUseTemplate = (template: typeof templates[number]) => {
    toast.success(`Using ${template.name} template!`);
    router.push(template.href);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isPublic />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" />
        <div className="container mx-auto px-4 py-16 md:py-20 text-center max-w-3xl relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/10 text-primary gap-1.5">
              <Zap className="h-3 w-3" />
              ATS-Friendly Templates
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-4">
              Pick your template,<br />
              <span className="text-primary">start tailoring</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Every template is tested against major ATS systems and designed to get you past the first screen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Template grid */}
      <section className="container mx-auto px-4 py-14 md:py-16 max-w-6xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              {template.popular && (
                <div className="absolute -top-3 left-5 z-20">
                  <Badge className="bg-primary text-primary-foreground shadow-sm text-[11px] font-semibold px-2.5">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className={cn(
                'rounded-2xl border overflow-hidden transition-all duration-300',
                'hover:shadow-xl hover:-translate-y-1',
                template.popular
                  ? 'border-primary/40 shadow-primary/10 shadow-lg ring-1 ring-primary/20'
                  : 'border-border/60 hover:border-border'
              )}>
                {/* Template preview */}
                <div className="relative overflow-hidden bg-white border-b border-border/40">
                  <TemplatePreview>
                    {template.id === 'classic' && <ClassicResumePreview />}
                    {template.id === 'modern' && <ModernResumePreview />}
                    {template.id === 'two-column' && <TwoColumnResumePreview />}
                  </TemplatePreview>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shadow-lg"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      {template.cta}
                    </Button>
                  </div>

                  {/* Accent bar at top */}
                  <div
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: template.accentColor }}
                  />
                </div>

                {/* Info panel */}
                <div className="p-5 bg-card">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-base font-bold">{template.name}</h3>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${template.accentColor}18`,
                        color: template.accentColor,
                      }}
                    >
                      {template.tag}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{template.description}</p>

                  <div className="grid grid-cols-2 gap-1.5 mb-5">
                    {template.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full gap-2 font-semibold text-sm"
                    style={template.id === 'two-column' ? { background: template.accentColor } : undefined}
                    onClick={() => handleUseTemplate(template)}
                  >
                    {template.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Coming soon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 rounded-2xl border border-dashed border-border/60 p-10 text-center"
        >
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Zap className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">More templates coming soon</h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Industry-specific templates for tech, finance, healthcare, creative, and more — all ATS-tested.
          </p>
          <Button variant="outline" asChild>
            <Link href="/app/coming-soon">View Roadmap</Link>
          </Button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
