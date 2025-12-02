'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion } from '@/components/ui/accordion';
import {
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Save,
  Eye,
  FileDown
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { toast } from 'react-toastify';
import { useCreateResumeStore } from '@/lib/zustand/store';
import { downloadResume } from '../lib/export-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HeaderSection } from '../components/HeaderSection';
import { ProfessionalSummarySection } from '../components/ProfessionalSummarySection';
import { SkillsSection } from '../components/SkillsSection';
import { ExperienceSection } from '../components/ExperienceSection';
import { EducationSection } from '../components/EducationSection';
import { ProjectsSection } from '../components/ProjectsSection';
import { CertificationsSection } from '../components/CertificationsSection';
import { ReferencesSection } from '../components/ReferencesSection';
import { ChangesSummarySection } from '../components/ChangesSummarySection';
import { ResumePreview } from '../components/ResumePreview';
import { useParams } from 'next/navigation';
import { TemplateBrowserDialog } from '../components/TemplateBrowserDialog';

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function ResumeBuilderPage() {

  const params = useParams<{ template?: string }>();
  const templateFromRoute = useMemo(() => {
    const value = Array.isArray(params?.template) ? params?.template[0] : params?.template;
    return value === 'modern' ? 'modern' : value === 'classic' ? 'classic' : null;
  }, [params?.template]);
  const [zoom, setZoom] = useState(100);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const activeTemplate = useCreateResumeStore((state) => state.activeTemplate)
  const setActiveTemplate = useCreateResumeStore((state) => state.setActiveTemplate);

  useEffect(() => {
    if (templateFromRoute) {
      setActiveTemplate(templateFromRoute);
    }
  }, [templateFromRoute, setActiveTemplate]);

  // Get all resume data
  const header = useCreateResumeStore((state) => state.header);
  const professionalSummary = useCreateResumeStore((state) => state.professionalSummary);
  const skills = useCreateResumeStore((state) => state.skills);
  const experience = useCreateResumeStore((state) => state.experience);
  const education = useCreateResumeStore((state) => state.education);
  const projects = useCreateResumeStore((state) => state.projects);
  const certifications = useCreateResumeStore((state) => state.certifications);
  const references = useCreateResumeStore((state) => state.references);
  const changesSummary = useCreateResumeStore((state) => state.changesSummary);

  type TemplateId = 'classic' | 'modern';

  const resumeData = useMemo(
    () => ({
      header,
      professionalSummary,
      skills,
      experience,
      education,
      projects,
      certifications,
      references,
      changesSummary,
    }),
    [header, professionalSummary, skills, experience, education, projects, certifications, references, changesSummary])

  const handleTemplateSelect = (templateId: TemplateId) => {
    setActiveTemplate(templateId);
    toast.success(`Switched to ${templateId === 'classic' ? 'Classic' : 'Modern'} template`);
    setShowTemplateBrowser(false);
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    try {
      setIsExporting(true);
      const resumeData = {
        header,
        professionalSummary,
        skills,
        experience,
        education,
        projects,
        certifications,
        references,
        changesSummary,
      };

      const filename = header.name ? header.name.replace(/\s+/g, '-').toLowerCase() : 'resume';
      await downloadResume(format, resumeData, activeTemplate, filename);
      toast.success(`${format.toUpperCase()} downloaded successfully!`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export resume');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Form */}
        <div className={cn(
          "w-full transition-all duration-300",
          showMobilePreview ? "lg:w-2/5" : "lg:w-2/5",
          showMobilePreview && "hidden lg:block"
        )}>
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Resume Builder</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setShowMobilePreview(!showMobilePreview)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Badge variant="outline" className="gap-1">
                  <Save className="h-3 w-3" />
                  Saved
                </Badge>
              </div>
            </div>

            <Accordion type="multiple" defaultValue={["header", "summary", "skills", "experience", "education"]} className="w-full">
              <HeaderSection />
              <ProfessionalSummarySection />
              <SkillsSection />
              <ExperienceSection />
              <EducationSection />
              <ProjectsSection />
              <CertificationsSection />
              <ReferencesSection />
              <ChangesSummarySection />
            </Accordion>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className={cn(
          "transition-all duration-300",
          showMobilePreview ? "w-full lg:w-3/5" : "hidden lg:block lg:w-3/5",
          "border-l bg-muted/30"
        )}>
          <div className="h-full flex flex-col">
            {/* Preview Toolbar */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <Tabs value={activeTemplate} onValueChange={(v) => setActiveTemplate(v as 'classic' | 'modern')}>
                  <TabsList>
                    <TabsTrigger value="classic">Classic</TabsTrigger>
                    <TabsTrigger value="modern">Modern</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setShowTemplateBrowser(true)}
                >
                  <Maximize className="h-4 w-4" />
                  Browse templates
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    disabled={zoom <= 25}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>

                  <Separator orientation="vertical" className="h-6" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Download'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport('pdf')}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Download as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info('DOCX export is coming soon!')}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Download as DOCX
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    onClick={() => toast.info('Share feature coming soon!')}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <ResumePreview zoom={zoom} activeTemplate={activeTemplate} />
          </div>
        </div>

        {/* Mobile Preview Toggle */}
        {showMobilePreview && (
          <div className="lg:hidden fixed inset-0 bg-background z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Resume Preview</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobilePreview(false)}
              >
                ← Back to Edit
              </Button>
            </div>
            <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 flex-shrink-0"
                onClick={() => setShowTemplateBrowser(true)}
              >
                <Maximize className="h-4 w-4" />
                Browse templates
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {zoom}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Download'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('DOCX export is coming soon!')}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download as DOCX (Coming Soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ResumePreview zoom={zoom} activeTemplate={activeTemplate} />
          </div>
        )}

        <TemplateBrowserDialog
          open={showTemplateBrowser}
          onOpenChange={setShowTemplateBrowser}
          onSelectTemplate={handleTemplateSelect}
          resumeData={resumeData}
        />
      </div>
    </div>
  );
}
