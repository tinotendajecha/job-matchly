import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { useCreateResumeStore } from '@/lib/zustand/store';
import { suggestSkills } from '../lib/ai-suggest';
import { useState } from 'react';
import { toast } from 'react-toastify';

export function SkillsSection() {
  const skills = useCreateResumeStore((state) => state.skills);
  const addSkill = useCreateResumeStore((state) => state.addSkill);
  const removeSkill = useCreateResumeStore((state) => state.removeSkill);
  const header = useCreateResumeStore((state) => state.header);
  const professionalSummary = useCreateResumeStore((state) => state.professionalSummary);
  const experience = useCreateResumeStore((state) => state.experience);

  const [technicalInput, setTechnicalInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleAddTechnical = () => {
    if (technicalInput.trim()) {
      addSkill('technical', technicalInput.trim());
      setTechnicalInput('');
    }
  };

  const handleAddSoft = () => {
    if (softInput.trim()) {
      addSkill('soft', softInput.trim());
      setSoftInput('');
    }
  };

  const aiSuggest = async () => {
    setIsSuggesting(true);
    try {
      const { technical, soft } = await suggestSkills({
        title: header.title,
        summary: professionalSummary,
        experience: experience.map((exp) => ({
          role: exp.role,
          company: exp.company,
          achievements: exp.achievements,
        })),
        existingTechnical: skills.technical,
        existingSoft: skills.soft,
      });

      const existingTechnicalLower = new Set(skills.technical.map((s) => s.toLowerCase()));
      const existingSoftLower = new Set(skills.soft.map((s) => s.toLowerCase()));
      let added = 0;
      technical.forEach((s) => {
        if (!existingTechnicalLower.has(s.toLowerCase())) {
          addSkill('technical', s);
          added += 1;
        }
      });
      soft.forEach((s) => {
        if (!existingSoftLower.has(s.toLowerCase())) {
          addSkill('soft', s);
          added += 1;
        }
      });

      if (added > 0) {
        toast.success(`Added ${added} suggested skill${added === 1 ? '' : 's'}!`);
      } else {
        toast.info('No new skills to suggest right now.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not generate suggestions. Try again.');
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <AccordionItem value="skills">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Skills
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={aiSuggest} disabled={isSuggesting} className="gap-1">
            {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI Suggest
          </Button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Technical Skills</Label>
            <div className="flex gap-2">
              <Input
                value={technicalInput}
                onChange={(e) => setTechnicalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTechnical();
                  }
                }}
                placeholder="e.g., React, TypeScript, Node.js"
              />
              <Button type="button" onClick={handleAddTechnical} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.technical.map((skill, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    onClick={() => removeSkill('technical', index)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Soft Skills</Label>
            <div className="flex gap-2">
              <Input
                value={softInput}
                onChange={(e) => setSoftInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSoft();
                  }
                }}
                placeholder="e.g., Leadership, Communication"
              />
              <Button type="button" onClick={handleAddSoft} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.soft.map((skill, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    onClick={() => removeSkill('soft', index)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

