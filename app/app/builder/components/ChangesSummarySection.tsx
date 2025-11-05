import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical } from 'lucide-react';
import { useCreateResumeStore } from '@/lib/zustand/store';

export function ChangesSummarySection() {
  const changesSummary = useCreateResumeStore((state) => state.changesSummary);
  const setChangesSummary = useCreateResumeStore((state) => state.setChangesSummary);

  return (
    <AccordionItem value="changesSummary">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Changes Summary
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="changesSummary">Summary of Changes</Label>
          <Textarea
            id="changesSummary"
            value={changesSummary}
            onChange={(e) => setChangesSummary(e.target.value)}
            rows={4}
            placeholder="Document any changes or updates made to your resume..."
          />
          <p className="text-xs text-muted-foreground">
            Optional: Track changes and updates to your resume
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

