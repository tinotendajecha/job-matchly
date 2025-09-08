'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  CheckCircle,
  Star,
  Zap,
  Shield,
  Download,
  Target,
  FileText,
  Users,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    description: 'Perfect for trying out JobMatchly',
    price: 'R0',
    period: 'forever',
    credits: '10 credits/month',
    features: [
      '1 resume build',
      'Basic templates access',
      'PDF download',
      'ATS basic check',
      'Community support'
    ],
    limitations: [
      'No cover letter generation',
      'No advanced ATS insights',
      'Basic keyword matching'
    ],
    cta: 'Start Free',
    popular: false,
    color: 'gray'
  },
  {
    name: 'Starter',
    description: 'For active job seekers',
    price: 'R149',
    period: 'month',
    credits: '50 credits/month',
    features: [
      '5 resume builds',
      'All premium templates',
      'JD tailoring with keyword highlighting',
      'Cover letter generation',
      'Advanced ATS scoring',
      'Priority email support',
      'Version history'
    ],
    limitations: [],
    cta: 'Start Free Trial',
    popular: true,
    color: 'primary'
  },
  {
    name: 'Pro',
    description: 'For power users and professionals',
    price: 'R299',
    period: 'month',
    credits: '200 credits/month',
    features: [
      'Unlimited resume builds',
      'All templates + early access',
      'Advanced AI suggestions',
      'Bulk JD tailoring',
      'LinkedIn profile optimization',
      'Interview prep materials',
      'Priority chat support',
      'Team collaboration (up to 3 members)',
      'Advanced analytics'
    ],
    limitations: [],
    cta: 'Start Free Trial',
    popular: false,
    color: 'purple'
  }
];

const faqs = [
  {
    question: 'How do credits work?',
    answer: 'Credits are consumed when you use AI features like resume building, JD tailoring, or cover letter generation. Basic edits and downloads don\'t use credits.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access to paid features until your current billing period ends.'
  },
  {
    question: 'What file formats do you support?',
    answer: 'We support PDF, DOCX uploads and can export to PDF, DOCX, and plain text formats. All templates are designed to be ATS-compatible.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use bank-level encryption and never share your personal information. Your resumes and data belong to you.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact support for a full refund.'
  },
  {
    question: 'Can I use my own templates?',
    answer: 'Currently, we provide curated, ATS-tested templates. Custom template upload is on our roadmap for Pro users.'
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header isPublic={true} />
      
      <div className="container mx-auto p-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-1" />
              Free for early users
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your job search needs. Start free, upgrade when you're ready.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-20">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                
                <Card className={cn(
                  "h-full relative overflow-hidden",
                  plan.popular && "ring-2 ring-primary shadow-xl scale-105"
                )}>
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/80" />
                  )}
                  
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <p className="text-muted-foreground">{plan.description}</p>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.credits}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {plan.limitations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Not included:</p>
                        <ul className="space-y-1">
                          {plan.limitations.map((limitation) => (
                            <li key={limitation} className="text-xs text-muted-foreground">
                              • {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full" 
                      size="lg"
                      variant={plan.popular ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/auth/signup">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Features Comparison */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-center mb-12">What's included</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: FileText, title: 'Resume Builder', description: 'Drag-and-drop editor with live preview' },
                { icon: Target, title: 'JD Tailoring', description: 'AI-powered keyword matching and optimization' },
                { icon: Zap, title: 'Cover Letters', description: 'Auto-generated, personalized cover letters' },
                { icon: Shield, title: 'ATS Optimization', description: 'Ensures your resume passes tracking systems' },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full text-center group hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mt-20 p-12 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-2xl"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who've transformed their applications with JobMatchly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/auth/signup">Start Free Today</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link href="/templates">View Templates</Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}