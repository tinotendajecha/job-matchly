import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useCreateResumeStore } from '@/lib/zustand/store';

export function EducationSection() {
  const education = useCreateResumeStore((state) => state.education);
  const addEducation = useCreateResumeStore((state) => state.addEducation);
  const updateEducation = useCreateResumeStore((state) => state.updateEducation);
  const removeEducation = useCreateResumeStore((state) => state.removeEducation);

  return (
    <AccordionItem value="education">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Education
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        {education.map((edu) => (
          <Card key={edu.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold">Education Entry</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(edu.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Institution *</Label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                    placeholder="University/School"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Degree *</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                    placeholder="Bachelor of Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field of Study</Label>
                  <Input
                    value={edu.fieldOfStudy}
                    onChange={(e) => updateEducation(edu.id, { fieldOfStudy: e.target.value })}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input
                    type="number"
                    value={edu.graduationYear}
                    onChange={(e) => updateEducation(edu.id, { graduationYear: e.target.value })}
                    placeholder="2024"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="w-full gap-1" onClick={addEducation}>
          <Plus className="h-4 w-4" />
          Add Education
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

