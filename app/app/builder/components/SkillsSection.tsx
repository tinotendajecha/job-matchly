import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Plus, X } from 'lucide-react';
import { useCreateResumeStore } from '@/lib/zustand/store';
import { useState } from 'react';

export function SkillsSection() {
  const skills = useCreateResumeStore((state) => state.skills);
  const addSkill = useCreateResumeStore((state) => state.addSkill);
  const removeSkill = useCreateResumeStore((state) => state.removeSkill);
  
  const [technicalInput, setTechnicalInput] = useState('');
  const [softInput, setSoftInput] = useState('');

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

  return (
    <AccordionItem value="skills">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Skills
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
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

