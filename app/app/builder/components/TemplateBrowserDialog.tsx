'use client';

import { useMemo, useRef, useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';
import { ResumeData, ResumeTemplate, templateRegistry } from '../lib/template-registry';
import '../lib/register-templates';
import '../styles/print.css';
import '../styles/resume-preview.css';

export type TemplateId = 'classic' | 'modern' | 'sleek' | 'minimal' | 'executive';
const SELECTABLE_TEMPLATE_IDS = ['classic', 'modern'] as const;
type SelectableTemplateId = typeof SELECTABLE_TEMPLATE_IDS[number];

type AvailableTemplateItem = {
  id: SelectableTemplateId;
  name: string;
  description: string;
  available: true;
  component: ResumeTemplate['component'];
};

type UpcomingTemplateItem = {
  id: Exclude<TemplateId, SelectableTemplateId>;
  name: string;
  description: string;
  available: false;
  preview: string;
};

type TemplateGalleryItem = AvailableTemplateItem | UpcomingTemplateItem;

const templateDescriptions: Record<TemplateId, string> = {
  classic: 'Clean ATS-friendly layout with subtle dividers and easy scanning.',
  modern: 'Two-column layout with bold accent color and modern typography.',
  sleek: 'Bold section titles, accent bars, and clean columns built for tech roles.',
  minimal: 'Whitespace-forward layout perfect for creative portfolios and design leads.',
  executive: 'Serif typography with elegant section framing for leadership positions.',
};

const registeredTemplates = templateRegistry.getAll();

const availableTemplates: AvailableTemplateItem[] = registeredTemplates
  .filter((template): template is ResumeTemplate & { id: SelectableTemplateId } =>
    SELECTABLE_TEMPLATE_IDS.includes(template.id as SelectableTemplateId)
  )
  .map((template) => ({
    id: template.id as SelectableTemplateId,
    name: template.name,
    description: templateDescriptions[template.id as TemplateId] ?? templateDescriptions.classic,
    available: true,
    component: template.component,
  }));

const upcomingTemplates: UpcomingTemplateItem[] = [
  {
    id: 'sleek',
    name: 'Sleek Professional',
    description: templateDescriptions.sleek,
    available: false,
    preview: '/api/placeholder/320/420?text=Sleek',
  },
  {
    id: 'minimal',
    name: 'Minimal Chic',
    description: templateDescriptions.minimal,
    available: false,
    preview: '/api/placeholder/320/420?text=Minimal',
  },
  {
    id: 'executive',
    name: 'Executive Edge',
    description: templateDescriptions.executive,
    available: false,
    preview: '/api/placeholder/320/420?text=Executive',
  },
];

const templateGallery: TemplateGalleryItem[] = [...availableTemplates, ...upcomingTemplates];

const previewFallback: ResumeData = {
  header: {
    name: 'Alex Taylor',
    title: 'Product Manager',
    email: 'alex.taylor@gmail.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    website: 'linkedin.com/in/alextaylor',
  },
  professionalSummary:
    'Product leader with 7+ years building data-driven solutions that delight users and drive measurable growth across SaaS, mobile, and marketplace products.',
  skills: {
    technical: ['Product Strategy', 'SQL', 'User Research', 'Experimentation'],
    soft: ['Stakeholder Management', 'Leadership', 'Communication'],
  },
  experience: [
    {
      id: 'preview-exp-1',
      company: 'Nova Labs',
      role: 'Senior Product Manager',
      startDate: '2020-04',
      endDate: '',
      isCurrent: true,
      achievements: [
        'Launched experimentation platform that increased activation rate by 18%.',
        'Led cross-functional squad of 12 engineers, designers, and analysts.',
      ],
    },
  ],
  education: [
    {
      id: 'preview-edu-1',
      institution: 'University of Washington',
      degree: 'B.S. Computer Science',
      fieldOfStudy: 'Human Centered Design',
      graduationYear: '2016',
    },
  ],
  projects: [
    {
      id: 'preview-proj-1',
      name: 'Growth Experiment Hub',
      description: 'Centralized experimentation backlog that improved test velocity by 2.3x.',
      technologies: ['React', 'Next.js', 'Postgres'],
    },
  ],
  certifications: [
    {
      id: 'preview-cert-1',
      name: 'Certified Scrum Product Owner',
      issuer: 'Scrum Alliance',
      date: '2019-02',
      expiryDate: '',
    },
  ],
  references: [
    {
      id: 'preview-ref-1',
      name: 'Jordan Lee',
      title: 'VP Product',
      company: 'Nova Labs',
      email: 'jordan.lee@novalabs.com',
      phone: '',
    },
  ],
  changesSummary: '',
};

function buildPreviewData(data: ResumeData): ResumeData {
  return {
    header: {
      ...previewFallback.header,
      ...data.header,
    },
    professionalSummary: data.professionalSummary || previewFallback.professionalSummary,
    skills: {
      technical: data.skills.technical.length ? data.skills.technical : previewFallback.skills.technical,
      soft: data.skills.soft.length ? data.skills.soft : previewFallback.skills.soft,
    },
    experience: data.experience.length ? data.experience : previewFallback.experience,
    education: data.education.length ? data.education : previewFallback.education,
    projects: data.projects.length ? data.projects : previewFallback.projects,
    certifications: data.certifications.length ? data.certifications : previewFallback.certifications,
    references: data.references.length ? data.references : previewFallback.references,
    changesSummary: data.changesSummary || previewFallback.changesSummary,
  };
}

interface TemplateBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: SelectableTemplateId) => void;
  resumeData: ResumeData;
}

export function TemplateBrowserDialog({
  open,
  onOpenChange,
  onSelectTemplate,
  resumeData,
}: TemplateBrowserDialogProps) {
  const templateCarouselRef = useRef<HTMLDivElement>(null);
  const [galleryScrollProgress, setGalleryScrollProgress] = useState(0);
  const previewData = useMemo(() => buildPreviewData(resumeData), [resumeData]);

  const handleTemplateScroll = () => {
    const el = templateCarouselRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const progress = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
    setGalleryScrollProgress(progress);
  };

  const upcomingProgress = useMemo(() => Math.max(0.05, galleryScrollProgress), [galleryScrollProgress]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:w-full sm:max-w-3xl lg:max-w-5xl h-[90vh] p-0 overflow-hidden gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 text-left">
              <DialogTitle className="text-xl font-semibold">Explore Templates</DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed max-w-2xl">
                Tap a design to instantly apply it. Upcoming templates arrive soon.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close template browser"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-muted/5">
          {/* Mobile / Tablet */}
          <div className="lg:hidden flex-1 flex flex-col min-h-0">
            <div
              ref={templateCarouselRef}
              onScroll={handleTemplateScroll}
              className="flex-1 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-6 py-6 items-stretch no-scrollbar"
              style={{ scrollPaddingInline: '1.5rem' }}
            >
              {templateGallery.map((template) => (
                <div
                  key={template.id}
                  className="w-[85vw] max-w-[360px] shrink-0 snap-center flex flex-col h-full max-h-[620px] bg-background border rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="relative w-full aspect-[3/4] bg-muted border-b">
                    {template.available ? (
                      <TemplatePreview templateComponent={template.component} resumeData={previewData} />
                    ) : (
                      <Image
                        src={template.preview}
                        alt={`${template.name} preview`}
                        fill
                        sizes="(max-width: 640px) 85vw, 360px"
                        className="object-cover"
                      />
                    )}
                    {!template.available && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                        <Badge variant="secondary" className="text-sm px-3 py-1 shadow-sm">Coming Soon</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white flex items-center justify-between">
                      <span className="font-medium truncate">{template.name}</span>
                      <span className="uppercase tracking-wide text-[10px]">
                        {template.available ? 'Live' : 'Soon'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col p-5">
                    <div className="space-y-2 mb-4">
                      <h4 className="text-xl font-semibold tracking-tight">{template.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {template.description}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                      <Button
                        size="lg"
                        className="w-full font-medium"
                        disabled={!template.available}
                        onClick={() =>
                          template.available
                            ? onSelectTemplate(template.id)
                            : toast.info('Coming soon!')
                        }
                      >
                        {template.available ? 'Use Template' : 'Notify Me'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={() => toast.info('Full preview coming soon!')}
                      >
                        Preview Design
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-1 bg-muted w-full mt-auto mb-1">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${upcomingProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block h-full overflow-y-auto p-8">
            <div className="grid grid-cols-3 gap-6 pb-10">
              {templateGallery.map((template) => (
                <div
                  key={template.id}
                  className="group relative flex flex-col bg-background border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                    {template.available ? (
                      <TemplatePreview templateComponent={template.component} resumeData={previewData} />
                    ) : (
                      <Image
                        src={template.preview}
                        alt={template.name}
                        fill
                        sizes="33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {template.available ? (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <Button
                          className="w-full bg-white text-black hover:bg-white/90"
                          onClick={() => onSelectTemplate(template.id)}
                        >
                          Select Template
                        </Button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Badge variant="secondary" className="text-xs px-3 py-1">Coming Soon</Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">{template.name}</h4>
                      {!template.available && <Badge variant="secondary" className="text-xs">Soon</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplatePreview({
  templateComponent: TemplateComponent,
  resumeData,
}: {
  templateComponent: ResumeTemplate['component'];
  resumeData: ResumeData;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="scale-[0.28] origin-top pointer-events-none" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="bg-white shadow-sm border mx-auto">
          <TemplateComponent data={resumeData} />
        </div>
      </div>
    </div>
  );
}
