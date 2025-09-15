// app/onboarding/client.tsx
'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Upload,
    ChevronLeft,
    ChevronRight,
    FileText,
    GraduationCap,
    Code,
    Target,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const steps = [
    { id: 1, title: 'Import', icon: Upload, description: 'Upload existing CV or start fresh' },
    { id: 2, title: 'Basics', icon: FileText, description: 'Your core information' },
    { id: 3, title: 'Education', icon: GraduationCap, description: 'Academic background' },
    { id: 4, title: 'Skills', icon: Code, description: 'Technical and soft skills' },
    { id: 5, title: 'Preferences', icon: Target, description: 'Career goals and preferences' },
];

const suggestedSkills = [
    'React', 'JavaScript', 'TypeScript', 'Python', 'Node.js',
    'CSS', 'HTML', 'Git', 'Docker', 'AWS', 'Communication',
    'Leadership', 'Problem Solving', 'Teamwork'
];

type ResumeDoc = { id: string; title: string; markdown: string };

type Props = {
    initialUser: { name: string; email: string };
    initialProfile: {
        headline: string;
        location: string;
        phone: string;
        website: string;
        linkedInUrl: string;
        school: string;
        degree: string;
        graduationYear: string;
        skills: string[];
        targetRoles: string;
        targetLocations: string;
        jobType: string;

    };
    initialResume: {
        id: string;
        title: string;
        markdown: string;
    } | null
};



export default function OnboardingClient({ initialUser, initialProfile, initialResume }: Props) {

    const [resumeDoc, setResumeDoc] = useState<ResumeDoc | null>(initialResume); // 👈
    const [previewExpanded, setPreviewExpanded] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [formData, setFormData] = useState({
        hasCV: false,
        linkedInUrl: initialProfile.linkedInUrl || '',
        name: initialUser.name || '',
        title: initialProfile.headline || '',
        location: initialProfile.location || '',
        email: initialUser.email || '',
        phone: initialProfile.phone || '',
        website: initialProfile.website || '',
        school: initialProfile.school || '',
        degree: initialProfile.degree || '',
        graduationYear: initialProfile.graduationYear || '',
        skills: initialProfile.skills || [],
        targetRoles: initialProfile.targetRoles || '',
        targetLocations: initialProfile.targetLocations || '',
        jobType: initialProfile.jobType || ''
    });

    const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
    const Icon = steps[currentStep - 1].icon;

    async function saveStep(partial: Partial<typeof formData>, opts?: { complete?: boolean }) {
        setSaving(true);
        try {
            const res = await fetch('/api/onboarding/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // map fields to API
                    name: partial.name ?? formData.name,
                    email: partial.email ?? formData.email,
                    headline: partial.title ?? formData.title,
                    location: partial.location ?? formData.location,
                    phone: partial.phone ?? formData.phone,
                    website: partial.website ?? formData.website,
                    linkedInUrl: partial.linkedInUrl ?? formData.linkedInUrl,
                    school: partial.school ?? formData.school,
                    degree: partial.degree ?? formData.degree,
                    graduationYear: partial.graduationYear ?? formData.graduationYear,
                    skills: partial.skills ?? formData.skills,
                    targetRoles: partial.targetRoles ?? formData.targetRoles,
                    targetLocations: partial.targetLocations ?? formData.targetLocations,
                    jobType: partial.jobType ?? formData.jobType,
                    complete: !!opts?.complete,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.error || 'Failed to save');
            }
            if (opts?.complete) {
                toast.success('Onboarding complete! 🎉');
                setTimeout(() => (window.location.href = '/app/dashboard'), 800);
            } else {
                toast.success('Saved');
            }
        } catch (e: any) {
            toast.error(e?.message || 'Could not save');
        } finally {
            setSaving(false);
        }
    }

    async function uploadCV(file: File) {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/onboarding/upload-resume', { method: 'POST', body: fd });
            const j = await res.json().catch(() => ({}));
            if (!res.ok || !j.ok) throw new Error(j?.error || 'Upload failed');

            // ✅ show preview right away (keep file name as title for clarity)
            setResumeDoc({
                id: j.documentId,
                title: file.name || 'Imported Resume',
                markdown: String(j.markdown || ''),
            });

            setFormData((prev) => ({ ...prev, hasCV: true }));
            toast.success('CV uploaded and saved');
        } catch (e: any) {
            toast.error(e?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    }

    function excerpt(md: string, maxChars = 1200): string {
        if (!md) return '';
        if (md.length <= maxChars) return md;
        return md.slice(0, maxChars).trimEnd() + '…';
    }



    const nextStep = async () => {
        if (currentStep < steps.length) {
            await saveStep({});
            setCurrentStep(currentStep + 1);
        } else {
            await saveStep({}, { complete: true });
        }
    };

    const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

    const addSkill = (skill: string) =>
        !formData.skills.includes(skill) &&
        setFormData({ ...formData, skills: [...formData.skills, skill] });

    const removeSkill = (skill: string) =>
        setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container max-w-4xl mx-auto p-4 py-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Let’s build your profile</h1>
                    <p className="text-muted-foreground">This helps us personalize your experience</p>
                </motion.div>

                {/* Progress */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        {steps.map((step) => (
                            <div key={step.id} className="flex flex-col items-center">
                                <motion.div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                        }`}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                                </motion.div>
                                <span className="text-xs mt-2 text-center hidden sm:block">{step.title}</span>
                            </div>
                        ))}
                    </div>
                    <Progress value={progress} className="h-2" />
                </motion.div>

                {/* Steps */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {Icon && <Icon className="h-5 w-5" />}
                                    {steps[currentStep - 1].title}
                                </CardTitle>
                                <p className="text-muted-foreground">{steps[currentStep - 1].description}</p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Step 1: Import */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                                <CardContent className="p-6 text-center">
                                                    <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                                                    <h3 className="font-semibold mb-2">Upload Existing CV</h3>
                                                    <p className="text-sm text-muted-foreground mb-4">We’ll extract your information automatically</p>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={uploading}
                                                    >
                                                        {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                                        Choose File
                                                    </Button>
                                                </CardContent>
                                            </Card>

                                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                                <CardContent className="p-6 text-center">
                                                    <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                                                    <h3 className="font-semibold mb-2">Start From Scratch</h3>
                                                    <p className="text-sm text-muted-foreground mb-4">Build your resume step by step</p>
                                                    <Button type="button" onClick={() => setFormData({ ...formData, hasCV: false })}>
                                                        Start Fresh
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                            {resumeDoc && (
                                                <Card className="border border-primary/20">
                                                    <CardHeader className="pb-2">
                                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                                            <CardTitle className="text-base flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-primary" />
                                                                {resumeDoc.title}
                                                            </CardTitle>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline">Uploaded</Badge>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => fileInputRef.current?.click()}
                                                                    disabled={uploading}
                                                                    type='button'
                                                                >
                                                                    Replace file
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        {/* <div className="text-sm text-muted-foreground mb-2">
                                                            Extracted preview (Markdown)
                                                        </div> */}

                                                        {/* Collapsible preview */}
                                                        {/* <pre className="rounded bg-muted p-3 text-xs md:text-sm max-h-64 overflow-auto whitespace-pre-wrap">
                                                            {previewExpanded ? resumeDoc.markdown : excerpt(resumeDoc.markdown)}
                                                        </pre> */}

                                                        {/* <div className="flex justify-end mt-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setPreviewExpanded((v) => !v)}
                                                            >
                                                                {previewExpanded ? 'Show less' : 'Show full'}
                                                            </Button>
                                                        </div> */}
                                                    </CardContent>
                                                </Card>
                                            )}

                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="linkedin">LinkedIn URL (Optional)</Label>
                                            <Input
                                                id="linkedin"
                                                placeholder="https://www.linkedin.com/in/your-handle"
                                                value={formData.linkedInUrl}
                                                onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                                            />
                                            <p className="text-xs text-muted-foreground">We can import your basic information later</p>
                                        </div>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".docx,.txt"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const f = e.target.files?.[0];
                                                (e.target as HTMLInputElement).value = '';
                                                if (!f) return;
                                                await uploadCV(f);
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Step 2: Basics */}
                                {currentStep === 2 && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name *</Label>
                                            <Input
                                                id="name"
                                                placeholder="Jane Doe"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Current Title *</Label>
                                            <Input
                                                id="title"
                                                placeholder="Software Developer"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <Input
                                                id="location"
                                                placeholder="City, Country (e.g., Harare, Zimbabwe)"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                placeholder="+1 555 123 4567"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Website/Portfolio</Label>
                                            <Input
                                                id="website"
                                                placeholder="https://yourdomain.dev"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Education */}
                                {currentStep === 3 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="school">School/University *</Label>
                                            <Input
                                                id="school"
                                                placeholder="Your University"
                                                value={formData.school}
                                                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="degree">Degree *</Label>
                                                <Input
                                                    id="degree"
                                                    placeholder="Bachelor of Computer Science"
                                                    value={formData.degree}
                                                    onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="year">Graduation Year *</Label>
                                                <Input
                                                    id="year"
                                                    placeholder="2026"
                                                    value={formData.graduationYear}
                                                    onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Skills */}
                                {currentStep === 4 && (
                                    <div className="space-y-6">
                                        <div>
                                            <Label className="text-base font-semibold mb-4 block">Select Your Skills</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                                                {suggestedSkills.map((skill) => (
                                                    <motion.button
                                                        key={skill}
                                                        type="button"
                                                        onClick={() => (formData.skills.includes(skill) ? removeSkill(skill) : addSkill(skill))}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Badge
                                                            variant={formData.skills.includes(skill) ? 'default' : 'outline'}
                                                            className="cursor-pointer w-full justify-center py-2"
                                                        >
                                                            {skill}
                                                        </Badge>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        {formData.skills.length > 0 && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                                                <Label>Selected Skills ({formData.skills.length})</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.skills.map((skill) => (
                                                        <Badge key={skill} variant="default" className="cursor-pointer" onClick={() => removeSkill(skill)}>
                                                            {skill} ×
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* Step 5: Preferences */}
                                {currentStep === 5 && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="targetRoles">Target Roles</Label>
                                            <Textarea
                                                id="targetRoles"
                                                placeholder="e.g., Software Engineer, Frontend Engineer, Full-Stack Developer"
                                                value={formData.targetRoles}
                                                onChange={(e) => setFormData({ ...formData, targetRoles: e.target.value })}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="targetLocations">Preferred Locations</Label>
                                            <Input
                                                id="targetLocations"
                                                placeholder="e.g., Remote, Harare; Nairobi; London"
                                                value={formData.targetLocations}
                                                onChange={(e) => setFormData({ ...formData, targetLocations: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Job Type</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {['Full-time', 'Part-time', 'Internship', 'Contract'].map((type) => (
                                                    <Button
                                                        key={type}
                                                        type="button"
                                                        variant={formData.jobType === type ? 'default' : 'outline'}
                                                        onClick={() => setFormData({ ...formData, jobType: type })}
                                                        className="justify-start"
                                                    >
                                                        {type}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                                            <ChevronLeft className="h-4 w-4 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                toast.info('You can finish onboarding later from your profile.');
                                                window.location.href = '/app/dashboard'; // ask-me-later: leave flag = false
                                            }}
                                        >
                                            Ask me later
                                        </Button>
                                    </div>
                                    <Button onClick={nextStep} disabled={saving}>
                                        {currentStep === steps.length ? 'Complete' : 'Next'}
                                        {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : currentStep < steps.length ? <ChevronRight className="h-4 w-4 ml-2" /> : null}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
