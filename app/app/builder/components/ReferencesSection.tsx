import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useCreateResumeStore } from '@/lib/zustand/store';

export function ReferencesSection() {
  const references = useCreateResumeStore((state) => state.references);
  const addReference = useCreateResumeStore((state) => state.addReference);
  const updateReference = useCreateResumeStore((state) => state.updateReference);
  const removeReference = useCreateResumeStore((state) => state.removeReference);

  return (
    <AccordionItem value="references">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          References (Optional)
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        {references.map((ref) => (
          <Card key={ref.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold">Reference Entry</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeReference(ref.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={ref.name}
                    onChange={(e) => updateReference(ref.id, { name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={ref.title}
                    onChange={(e) => updateReference(ref.id, { title: e.target.value })}
                    placeholder="Senior Manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <Input
                    value={ref.company}
                    onChange={(e) => updateReference(ref.id, { company: e.target.value })}
                    placeholder="Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={ref.email}
                    onChange={(e) => updateReference(ref.id, { email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={ref.phone}
                    onChange={(e) => updateReference(ref.id, { phone: e.target.value })}
                    placeholder="+27 123 456 7890"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="w-full gap-1" onClick={addReference}>
          <Plus className="h-4 w-4" />
          Add Reference
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

