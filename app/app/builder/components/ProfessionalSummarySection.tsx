import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Sparkles } from 'lucide-react';
import { useCreateResumeStore } from '@/lib/zustand/store';
import { toast } from 'react-toastify';

export function ProfessionalSummarySection() {
  const professionalSummary = useCreateResumeStore((state) => state.professionalSummary);
  const setProfessionalSummary = useCreateResumeStore((state) => state.setProfessionalSummary);

  const aiSuggest = () => {
    toast.info('AI suggestions feature coming soon!');
  };

  return (
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
            value={professionalSummary}
            onChange={(e) => setProfessionalSummary(e.target.value)}
            rows={4}
            placeholder="Write a compelling summary that highlights your key strengths..."
          />
          <p className="text-xs text-muted-foreground">
            {professionalSummary.length}/300 characters • Focus on impact and results
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

