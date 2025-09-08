'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  GripVertical,
  Plus,
  Trash2,
  Sparkles,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize,
  FileText,
  Save,
  Eye
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

interface ResumeSection {
  id: string;
  title: string;
  enabled: boolean;
  content: any;
}

const initialSections: ResumeSection[] = [
  { id: 'personal', title: 'Personal Details', enabled: true, content: {} },
  { id: 'summary', title: 'Professional Summary', enabled: true, content: {} },
  { id: 'experience', title: 'Work Experience', enabled: true, content: {} },
  { id: 'education', title: 'Education', enabled: true, content: {} },
  { id: 'skills', title: 'Skills', enabled: true, content: {} },
  { id: 'projects', title: 'Projects', enabled: false, content: {} },
  { id: 'extras', title: 'Additional Sections', enabled: false, content: {} },
];

export default function ResumeBuilderPage() {
  const [sections, setSections] = useState(initialSections);
  const [activeTemplate, setActiveTemplate] = useState('classic');
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [personalData, setPersonalData] = useState({
    name: 'John Doe',
    title: 'Frontend Developer',
    email: 'john@example.com',
    phone: '+27 123 456 7890',
    location: 'Cape Town, South Africa',
    website: 'johndoe.dev'
  });
  const [summary, setSummary] = useState('Passionate frontend developer with 3+ years of experience building responsive web applications using React and TypeScript.');
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, enabled: !section.enabled }
        : section
    ));
    toast.success('Section updated');
  };

  const aiSuggest = () => {
    toast.info('AI suggestions feature coming soon!');
  };

  function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
  }
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

            <Accordion type="multiple" defaultValue={["personal", "summary"]} className="w-full">
              {/* Personal Details */}
              <AccordionItem value="personal">
                <AccordionTrigger className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    Personal Details
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={personalData.name}
                        onChange={(e) => setPersonalData({...personalData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Professional Title *</Label>
                      <Input
                        id="title"
                        value={personalData.title}
                        onChange={(e) => setPersonalData({...personalData, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={personalData.email}
                        onChange={(e) => setPersonalData({...personalData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={personalData.phone}
                        onChange={(e) => setPersonalData({...personalData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={personalData.location}
                        onChange={(e) => setPersonalData({...personalData, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website/Portfolio</Label>
                      <Input
                        id="website"
                        value={personalData.website}
                        onChange={(e) => setPersonalData({...personalData, website: e.target.value})}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Professional Summary */}
              <AccordionItem value="summary">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    Professional Summary
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="summary">Summary (2-3 sentences)</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={aiSuggest}
                        className="gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Suggest
                      </Button>
                    </div>
                    <Textarea
                      id="summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={4}
                      placeholder="Write a compelling summary that highlights your key strengths..."
                    />
                    <p className="text-xs text-muted-foreground">
                      {summary.length}/300 characters • Focus on impact and results
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Experience */}
              <AccordionItem value="experience">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    Work Experience
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Company *</Label>
                          <Input placeholder="Company Name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Role *</Label>
                          <Input placeholder="Job Title" />
                        </div>
                        <div className="space-y-2">
                          <Label>Start Date *</Label>
                          <Input type="month" />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input type="month" placeholder="Present" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Key Achievements</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={aiSuggest}
                            className="gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            AI Suggest
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Input placeholder="• Led team of 5 developers to deliver..." />
                          <Input placeholder="• Improved application performance by 40%..." />
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Plus className="h-3 w-3" />
                            Add Achievement
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Button variant="outline" className="w-full gap-1">
                    <Plus className="h-4 w-4" />
                    Add Experience
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Other sections would follow similar pattern */}
              <AccordionItem value="education">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    Education
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input placeholder="University/School" />
                      <Input placeholder="Degree" />
                      <Input placeholder="Field of Study" />
                      <Input type="number" placeholder="Graduation Year" />
                    </div>
                    <Button variant="outline" className="w-full gap-1">
                      <Plus className="h-4 w-4" />
                      Add Education
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
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
                <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
                  <TabsList>
                    <TabsTrigger value="classic">Classic</TabsTrigger>
                    <TabsTrigger value="modern">Modern</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(50, zoom - 25))}
                    disabled={zoom <= 50}
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
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    onClick={() => toast.info('Download feature coming soon!')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
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
            <div className="flex-1 overflow-auto p-6">
              <motion.div
                className="mx-auto bg-white shadow-lg"
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  width: '8.5in',
                  minHeight: '11in',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-8 space-y-6">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <motion.h1 
                      className="text-2xl font-bold text-gray-900"
                      key={personalData.name}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                    >
                      {personalData.name || 'Your Name'}
                    </motion.h1>
                    <motion.p 
                      className="text-lg text-gray-700"
                      key={personalData.title}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                    >
                      {personalData.title || 'Professional Title'}
                    </motion.p>
                    <div className="flex justify-center gap-4 text-sm text-gray-600 flex-wrap">
                      {personalData.email && <span>{personalData.email}</span>}
                      {personalData.phone && <span>{personalData.phone}</span>}
                      {personalData.location && <span>{personalData.location}</span>}
                      {personalData.website && <span>{personalData.website}</span>}
                    </div>
                  </div>

                  <div className="border-b border-gray-300" />

                  {/* Summary */}
                  {sections.find(s => s.id === 'summary')?.enabled && (
                    <div>
                      <h2 className={cn(
                        "text-lg font-semibold mb-3",
                        activeTemplate === 'modern' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-900'
                      )}>
                        Professional Summary
                      </h2>
                      <motion.p 
                        className="text-gray-700 leading-relaxed"
                        key={summary}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                      >
                        {summary || 'Your professional summary will appear here...'}
                      </motion.p>
                    </div>
                  )}

                  {/* Experience */}
                  {sections.find(s => s.id === 'experience')?.enabled && (
                    <div>
                      <h2 className={cn(
                        "text-lg font-semibold mb-4",
                        activeTemplate === 'modern' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-900'
                      )}>
                        Work Experience
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">Frontend Developer</h3>
                              <p className="text-gray-700">Tech Startup Inc.</p>
                            </div>
                            <span className="text-sm text-gray-600">2022 - Present</span>
                          </div>
                          <ul className="space-y-1 text-gray-700 ml-4">
                            <li>• Led development of React-based dashboard improving user engagement by 40%</li>
                            <li>• Collaborated with design team to implement responsive UI components</li>
                            <li>• Optimized application performance reducing load times by 60%</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {sections.find(s => s.id === 'education')?.enabled && (
                    <div>
                      <h2 className={cn(
                        "text-lg font-semibold mb-4",
                        activeTemplate === 'modern' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-900'
                      )}>
                        Education
                      </h2>
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">Bachelor of Computer Science</h3>
                            <p className="text-gray-700">University of Cape Town</p>
                          </div>
                          <span className="text-sm text-gray-600">2024</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {sections.find(s => s.id === 'skills')?.enabled && (
                    <div>
                      <h2 className={cn(
                        "text-lg font-semibold mb-4",
                        activeTemplate === 'modern' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-gray-900'
                      )}>
                        Skills
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Technical</h3>
                          <div className="flex flex-wrap gap-1">
                            {['React', 'TypeScript', 'Node.js', 'Python'].map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Soft Skills</h3>
                          <div className="flex flex-wrap gap-1">
                            {['Leadership', 'Communication', 'Problem Solving'].map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              
              <div className="text-center text-xs text-gray-500 mt-4">
                1 page • ~450 words • ATS Score: 92%
              </div>
            </div>
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
            <div className="p-4 overflow-auto">
              {/* Same preview content as desktop */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}