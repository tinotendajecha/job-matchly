import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import { useCreateResumeStore } from '@/lib/zustand/store';
import { useState } from 'react';

export function ProjectsSection() {
  const projects = useCreateResumeStore((state) => state.projects);
  const addProject = useCreateResumeStore((state) => state.addProject);
  const updateProject = useCreateResumeStore((state) => state.updateProject);
  const removeProject = useCreateResumeStore((state) => state.removeProject);
  const addProjectTechnology = useCreateResumeStore((state) => state.addProjectTechnology);
  const removeProjectTechnology = useCreateResumeStore((state) => state.removeProjectTechnology);

  const [techInputs, setTechInputs] = useState<Record<string, string>>({});

  const handleAddTechnology = (projId: string) => {
    const input = techInputs[projId]?.trim();
    if (input) {
      addProjectTechnology(projId, input);
      setTechInputs({ ...techInputs, [projId]: '' });
    }
  };

  return (
    <AccordionItem value="projects">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Projects (Optional)
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        {projects.map((proj) => (
          <Card key={proj.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold">Project Entry</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProject(proj.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Name *</Label>
                    <Input
                      value={proj.name}
                      onChange={(e) => updateProject(proj.id, { name: e.target.value })}
                      placeholder="Project Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Project URL</Label>
                    <Input
                      value={proj.url}
                      onChange={(e) => updateProject(proj.id, { url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={proj.description}
                    onChange={(e) => updateProject(proj.id, { description: e.target.value })}
                    rows={3}
                    placeholder="Describe the project and your contributions..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Technologies</Label>
                  <div className="flex gap-2">
                    <Input
                      value={techInputs[proj.id] || ''}
                      onChange={(e) => setTechInputs({ ...techInputs, [proj.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTechnology(proj.id);
                        }
                      }}
                      placeholder="React, TypeScript..."
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddTechnology(proj.id)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {proj.technologies.map((tech, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {tech}
                        <button
                          onClick={() => removeProjectTechnology(proj.id, index)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="w-full gap-1" onClick={addProject}>
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

