'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Target, 
  Zap, 
  CheckCircle, 
  Star,
  ArrowRight,
  Users,
  TrendingUp,
  Shield,
  Smartphone,
  Download,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at Google",
    avatar: "SC",
    quote: "Got my interview in 2 weeks using JobMatchly. The ATS optimization made all the difference.",
    rating: 5
  },
  {
    name: "Marcus Johnson", 
    role: "Data Analyst at Microsoft",
    avatar: "MJ",
    quote: "The keyword matching feature is incredible. My resume now speaks the same language as job posts.",
    rating: 5
  },
  {
    name: "Priya Patel",
    role: "UX Designer at Figma", 
    avatar: "PP",
    quote: "Beautiful templates that actually pass ATS. Finally, design and function in one tool.",
    rating: 5
  }
];

const features = [
  {
    icon: FileText,
    title: "Live Side-by-Side Builder",
    description: "See your resume update in real-time as you edit. What you see is what you get."
  },
  {
    icon: Target,
    title: "JD Tailoring",
    description: "Paste any job description and watch keywords highlight across your resume."
  },
  {
    icon: BarChart3,
    title: "ATS Score",
    description: "Instant compatibility score with actionable tips to pass applicant tracking systems."
  },
  {
    icon: Zap,
    title: "Cover Letters",
    description: "Generate tailored cover letters that match your resume and the role."
  },
  {
    icon: TrendingUp,
    title: "Impact-Driven Bullets",
    description: "Smart suggestions help you quantify achievements and use power words."
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    description: "Edit, preview, and apply from anywhere. Optimized for phone and tablet."
  }
];

const painPoints = [
  {
    title: "ATS rejects up to 75%",
    description: "Before a human even sees them",
    icon: Shield
  },
  {
    title: "Tailoring is slow",
    description: "Hours per application adds up",
    icon: TrendingUp
  },
  {
    title: "Hard to quantify impact", 
    description: "Vague bullets don't impress",
    icon: Target
  },
  {
    title: "Design vs ATS",
    description: "Beautiful doesn't always pass",
    icon: CheckCircle
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header isPublic={true} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        <div className="container relative px-4">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge variant="outline" className="mb-6 px-4 py-2">
                <motion.span
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Free for early users
                </motion.span>
              </Badge>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                Build. Tailor.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
                  Get Hired.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                AI-powered resume builder that tailors your CV to each job — and passes ATS checks.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  size="lg" 
                  asChild
                  className={cn(
                    "text-lg px-8 py-6 bg-gradient-to-r font-medium",
                    "from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                    "text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                  )}
                >
                  <Link href="/auth/signup">
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                  <Link href="/templates">See Templates</Link>
                </Button>
              </div>
            </motion.div>

            {/* Hero Interactive Demo */}
            <motion.div
              className="relative mx-auto max-w-5xl"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Job Description Mock */}
                <Card className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 text-left">Job Description</h3>
                    <div className="text-sm text-left space-y-2 text-muted-foreground">
                      <p>We're looking for a <motion.span 
                        className="bg-primary/20 px-1 rounded"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                      >Frontend Developer</motion.span> with experience in <motion.span 
                        className="bg-primary/20 px-1 rounded"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >React</motion.span>, <motion.span 
                        className="bg-primary/20 px-1 rounded"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      >TypeScript</motion.span>, and modern web technologies.</p>
                      <p>Strong <motion.span 
                        className="bg-primary/20 px-1 rounded"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                      >problem-solving skills</motion.span> and ability to work in <motion.span 
                        className="bg-primary/20 px-1 rounded"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 2 }}
                      >agile environments</motion.span>.</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Resume Mock */}
                <Card className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Your Resume</h3>
                      <motion.div
                        className="text-sm font-medium text-green-600"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ATS Score: 92%
                      </motion.div>
                    </div>
                    <div className="text-sm text-left space-y-2">
                      <p className="font-medium">John Doe</p>
                      <p className="text-muted-foreground"><motion.span 
                        className="bg-primary/20 px-1 rounded"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                      >Frontend Developer</motion.span></p>
                      <div className="space-y-1 text-muted-foreground">
                        <p>• Built responsive web apps using <motion.span 
                          className="bg-primary/20 px-1 rounded"
                          animate={{ opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        >React</motion.span> and <motion.span 
                          className="bg-primary/20 px-1 rounded"
                          animate={{ opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        >TypeScript</motion.span></p>
                        <p>• Applied <motion.span 
                          className="bg-primary/20 px-1 rounded"
                          animate={{ opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                        >problem-solving skills</motion.span> to optimize performance</p>
                        <p>• Collaborated in <motion.span 
                          className="bg-primary/20 px-1 rounded"
                          animate={{ opacity: [1, 0.7, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 2 }}
                        >agile environments</motion.span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Process Flow */}
              <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
                <span>Build</span>
                <ArrowRight className="h-4 w-4" />
                <span>Tailor</span>
                <ArrowRight className="h-4 w-4" />
                <span>Score</span>
                <ArrowRight className="h-4 w-4" />
                <span className="text-primary font-medium">Apply</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container px-4">
          <motion.div 
            className="text-center mb-8"
            {...fadeInUp}
          >
            <p className="text-sm text-muted-foreground">Trusted by students and professionals at</p>
          </motion.div>
          <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap opacity-60">
            {['Google', 'Microsoft', 'Apple', 'Meta', 'Amazon'].map((company) => (
              <motion.div
                key={company}
                className="text-lg font-semibold"
                whileHover={{ scale: 1.05, opacity: 0.8 }}
              >
                {company}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20">
        <div className="container px-4">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Problem</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Job applications shouldn't feel like throwing resumes into a void
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
          >
            {painPoints.map((point, index) => (
              <motion.div key={point.title} variants={fadeInUp}>
                <Card className="h-full group hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <point.icon className="h-6 w-6 text-destructive" />
                    </div>
                    <h3 className="font-semibold mb-2">{point.title}</h3>
                    <p className="text-sm text-muted-foreground">{point.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How JobMatchly Solves It</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From blank page to hired in minutes, not hours
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {[
                { step: "01", title: "Build", desc: "Start from clean, ATS-friendly templates" },
                { step: "02", title: "Tailor", desc: "Paste JD → keywords light up on your resume" },
                { step: "03", title: "Score", desc: "Instant ATS compatibility check + fixes" },
                { step: "04", title: "Apply", desc: "Download optimized PDF and cover letter" }
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">John Doe - Frontend Developer</h4>
                        <motion.div
                          className="text-sm font-medium text-green-600"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          ATS Score: 92%
                        </motion.div>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• Built responsive applications using <span className="bg-primary/20 px-1 rounded">React</span> and <span className="bg-primary/20 px-1 rounded">TypeScript</span></p>
                        <p>• Improved page load speed by <span className="bg-primary/20 px-1 rounded">40%</span></p>
                        <p>• Led team of <span className="bg-primary/20 px-1 rounded">3 developers</span></p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating elements */}
              <motion.div
                className="absolute -top-4 -right-4 bg-primary rounded-full p-3"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <CheckCircle className="h-6 w-6 text-primary-foreground" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container px-4">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for the modern job search, designed for results
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
          >
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Template Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Beautiful Templates</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ATS-friendly designs that actually look great
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { name: "Classic", description: "Clean and professional" },
              { name: "Modern", description: "Bold and creative" }
            ].map((template, index) => (
              <motion.div
                key={template.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-[8.5/11] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center relative">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-primary/50 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">{template.name} Template</p>
                      </div>
                      <Badge className="absolute top-3 right-3">ATS-friendly</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container px-4">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands who've landed their dream jobs
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={testimonial.name} variants={fadeInUp}>
                <Card className="h-full group hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + i * 0.1 }}
                        >
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">{testimonial.avatar}</span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you're ready
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { 
                name: "Free", 
                price: "R0", 
                period: "forever",
                features: ["1 resume", "Basic templates", "PDF download"],
                cta: "Start Free",
                popular: false
              },
              { 
                name: "Starter", 
                price: "R149", 
                period: "month",
                features: ["5 resumes", "All templates", "ATS checking", "Cover letters"],
                cta: "Start Free Trial",
                popular: true
              },
              { 
                name: "Pro", 
                price: "R299", 
                period: "month",
                features: ["Unlimited resumes", "Priority support", "Advanced analytics", "Team sharing"],
                cta: "Start Free Trial",
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <Card className={cn(
                  "h-full",
                  plan.popular && "ring-2 ring-primary shadow-lg scale-105"
                )}>
                  <CardContent className="p-6 text-center">
                    <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full"
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

          <motion.div 
            className="text-center mt-8"
            {...fadeInUp}
          >
            <Button variant="ghost" asChild>
              <Link href="/pricing">View detailed pricing</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(600px circle at 0% 0%, rgba(164, 255, 60, 0.1), transparent 50%)",
              "radial-gradient(600px circle at 100% 100%, rgba(255, 107, 44, 0.1), transparent 50%)",
              "radial-gradient(600px circle at 0% 0%, rgba(164, 255, 60, 0.1), transparent 50%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        
        <div className="container relative px-4 text-center">
          <motion.div
            {...fadeInUp}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to land your next role?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of job seekers who've transformed their applications with JobMatchly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className={cn(
                  "text-lg px-8 py-6 bg-gradient-to-r font-medium shadow-lg hover:shadow-xl transition-all duration-300",
                  "from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                  "text-primary-foreground"
                )}
                asChild
              >
                <Link href="/auth/signup">
                  Start Building Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link href="/templates">Explore Templates</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}