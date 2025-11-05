'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  Eye,
  Download,
  Star,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const templates = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean and professional design that passes all ATS systems',
    features: ['ATS-optimized', 'Single column', 'Conservative styling'],
    preview: '/api/placeholder/400/500',
    popular: false
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold and creative layout with accent colors and modern typography',
    features: ['Eye-catching design', 'Color accents', 'Modern typography'],
    preview: '/api/placeholder/400/500',
    popular: true
  }
];

export default function TemplatesPage() {
  const handleUseTemplate = (templateId: string) => {
    toast.success(`Using ${templates.find(t => t.id === templateId)?.name} template!`);
    setTimeout(() => {
      window.location.href = `/app/builder/template=${templateId}`;
    }, 1000);
  };

  const handlePreview = (templateId: string) => {
    toast.info('Opening full preview...');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Resume Templates</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from our collection of ATS-friendly, professionally designed templates
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ y: -5 }}
                className="relative group"
              >
                {template.popular && (
                  <Badge className="absolute -top-3 left-4 z-10 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                
                <Card className="overflow-hidden h-full group-hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-0">
                    {/* Template Preview */}
                    <div className="aspect-[8.5/11] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center relative overflow-hidden">
                      <motion.div
                        className="w-32 h-40 bg-white shadow-lg rounded-sm flex flex-col p-2 text-xs"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Mock resume preview */}
                        <div className="space-y-1">
                          <div className="h-2 bg-gray-900 rounded-sm" />
                          <div className="h-1 bg-gray-600 rounded-sm w-3/4" />
                          <div className="h-px bg-gray-300 my-1" />
                          <div className="space-y-0.5">
                            <div className="h-1 bg-gray-700 rounded-sm w-1/2" />
                            <div className="h-0.5 bg-gray-500 rounded-sm" />
                            <div className="h-0.5 bg-gray-500 rounded-sm w-5/6" />
                            <div className="h-0.5 bg-gray-500 rounded-sm w-3/4" />
                          </div>
                          <div className="h-px bg-gray-300 my-1" />
                          <div className="space-y-0.5">
                            <div className="h-1 bg-gray-700 rounded-sm w-1/3" />
                            <div className="h-0.5 bg-gray-500 rounded-sm w-4/5" />
                            <div className="h-0.5 bg-gray-500 rounded-sm w-2/3" />
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePreview(template.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template.id)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold">{template.name}</h3>
                        <div className="flex gap-1">
                          {template.features.map((feature) => (
                            feature === 'ATS-optimized' ? (
                              <Badge key={feature} variant="outline" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                ATS
                              </Badge>
                            ) : null
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">
                        {template.description}
                      </p>
                      
                      <div className="space-y-2 mb-6">
                        {template.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(template.id)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template.id)}
                          className="gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-16"
          >
            <h2 className="text-2xl font-bold mb-4">More templates coming soon!</h2>
            <p className="text-muted-foreground mb-6">
              We are working on industry-specific templates for tech, finance, healthcare, and more.
            </p>
            <Button variant="outline" asChild>
              <Link href="/app/coming-soon">View Roadmap</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}