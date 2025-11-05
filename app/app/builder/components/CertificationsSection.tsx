import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useCreateResumeStore } from '@/lib/zustand/store';

export function CertificationsSection() {
  const certifications = useCreateResumeStore((state) => state.certifications);
  const addCertification = useCreateResumeStore((state) => state.addCertification);
  const updateCertification = useCreateResumeStore((state) => state.updateCertification);
  const removeCertification = useCreateResumeStore((state) => state.removeCertification);

  return (
    <AccordionItem value="certifications">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Certifications (Optional)
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-4">
        {certifications.map((cert) => (
          <Card key={cert.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold">Certification Entry</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCertification(cert.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Certification Name *</Label>
                  <Input
                    value={cert.name}
                    onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                    placeholder="AWS Certified Solutions Architect"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Issuer *</Label>
                  <Input
                    value={cert.issuer}
                    onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                    placeholder="Amazon Web Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date Issued</Label>
                  <Input
                    type="month"
                    value={cert.date}
                    onChange={(e) => updateCertification(cert.id, { date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date (if applicable)</Label>
                  <Input
                    type="month"
                    value={cert.expiryDate}
                    onChange={(e) => updateCertification(cert.id, { expiryDate: e.target.value })}
                    placeholder="Leave empty if no expiry"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="w-full gap-1" onClick={addCertification}>
          <Plus className="h-4 w-4" />
          Add Certification
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
}

