import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical } from 'lucide-react';
import { useCreateResumeStore } from '@/lib/zustand/store';

export function HeaderSection() {
  const header = useCreateResumeStore((state) => state.header);
  const setHeader = useCreateResumeStore((state) => state.setHeader);

  return (
    <AccordionItem value="header">
      <AccordionTrigger className="flex justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Header
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={header.name}
              onChange={(e) => setHeader({ name: e.target.value })}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Professional Title *</Label>
            <Input
              id="title"
              value={header.title}
              onChange={(e) => setHeader({ title: e.target.value })}
              placeholder="Frontend Developer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={header.email}
              onChange={(e) => setHeader({ email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={header.phone}
              onChange={(e) => setHeader({ phone: e.target.value })}
              placeholder="+27 123 456 7890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={header.location}
              onChange={(e) => setHeader({ location: e.target.value })}
              placeholder="Cape Town, South Africa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website/Portfolio</Label>
            <Input
              id="website"
              value={header.website}
              onChange={(e) => setHeader({ website: e.target.value })}
              placeholder="johndoe.dev"
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

