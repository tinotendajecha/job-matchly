import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import { useCreateResumeStore } from '@/lib/zustand/store';
import { useState } from 'react';
import { toast } from 'react-toastify';

export function ExperienceSection() {
  const experience = useCreateResumeStore((state) => state.experience);
  const addExperience = useCreateResumeStore((state) => state.addExperience);
  const updateExperience = useCreateResumeStore((state) => state.updateExperience);
  const removeExperience = useCreateResumeStore((state) => state.removeExperience);
  const addExperienceAchievement = useCreateResumeStore((state) => state.addExperienceAchievement);
  const removeExperienceAchievement = useCreateResumeStore((state) => state.removeExperienceAchievement);

  const [achievementInputs, setAchievementInputs] = useState<Record<string, string>>({});

  const handleAddAchievement = (expId: string) => {
    const input = achievementInputs[expId]?.trim();
    if (input) {
      addExperienceAchievement(expId, input);
      setAchievementInputs({ ...achievementInputs, [expId]: '' });
    }
  };

  const aiSuggest = () => {
    toast.info('AI suggestions feature coming soon!');
  };

  return (
    <AccordionItem value="experience">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Experience
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        {experience.map((exp) => (
          <Card key={exp.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold">Experience Entry</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExperience(exp.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                    placeholder="Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Input
                    value={exp.role}
                    onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                    placeholder="Job Title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="month"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="flex-1">End Date</Label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={exp.isCurrent}
                        onChange={(e) => updateExperience(exp.id, { isCurrent: e.target.checked })}
                      />
                      Current
                    </label>
                  </div>
                  {!exp.isCurrent && (
                    <Input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                    />
                  )}
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
                    <Plus className="h-3 w-3" />
                    AI Suggest
                  </Button>
                </div>
                <div className="space-y-2">
                  {exp.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={achievement}
                        onChange={(e) => {
                          const newAchievements = [...exp.achievements];
                          newAchievements[index] = e.target.value;
                          updateExperience(exp.id, { achievements: newAchievements });
                        }}
                        placeholder="• Led team of 5 developers to deliver..."
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperienceAchievement(exp.id, index)}
                        className="text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={achievementInputs[exp.id] || ''}
                      onChange={(e) => setAchievementInputs({ ...achievementInputs, [exp.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAchievement(exp.id);
                        }
                      }}
                      placeholder="• Add achievement..."
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddAchievement(exp.id)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="w-full gap-1" onClick={addExperience}>
          <Plus className="h-4 w-4" />
          Add Experience
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

