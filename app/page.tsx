'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cubicBezier } from "framer-motion";
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
  BarChart3,
  Calculator,
  Sparkles,
  Coins
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { pricePerCreditUSD, computeSubtotalUSD } from '@/lib/pricing';

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

const floatAnimation = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: cubicBezier(0.4, 0, 0.6, 1)
    }
  }
};

// Pricing Calculator Component
function PricingCalculator() {
  const [credits, setCredits] = useState(10);
  
  const pricePerCredit = pricePerCreditUSD(credits);
  const totalPrice = computeSubtotalUSD(credits);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-background via-background to-primary/5 rounded-2xl border border-primary/20 p-8 backdrop-blur-sm"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Credit Calculator</h3>
        <p className="text-muted-foreground">Buy credits as you need them</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Number of Credits</label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="3"
              value={credits}
              onChange={(e) => setCredits(Math.max(3, parseInt(e.target.value) || 3))}
              className="text-center font-mono"
            />
            <div className="text-sm text-muted-foreground">
              ${pricePerCredit.toFixed(2)} per credit
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Price</span>
            <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
          </div>
          {credits >= 10 && (
            <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Bulk discount applied
            </div>
          )}
        </div>
        
        <Button asChild className="w-full" size="lg">
          <Link href="/app/billing">
            <Coins className="h-4 w-4 mr-2" />
            Buy Credits
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header isPublic={true} />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Futuristic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        {/* Floating Elements */}
        <motion.div
          {...floatAnimation}
          className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            y: [-15, 15, -15],
            transition: { duration: 8, repeat: Infinity, ease: cubicBezier(0.4, 0, 0.6, 1) }
          }}
          className="absolute top-40 right-20 w-16 h-16 bg-primary/20 rounded-full blur-lg"
        />
        <motion.div
          animate={{
            y: [-20, 20, -20],
            transition: { duration: 10, repeat: Infinity, ease: cubicBezier(0.4, 0, 0.6, 1) }
          }}
          className="absolute bottom-20 left-1/4 w-12 h-12 bg-primary/15 rounded-full blur-md"
        />
        
        <div className="container relative px-4 mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <Badge 
                  variant="outline" 
                  className="mb-6 px-6 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 backdrop-blur-sm"
                >
                <motion.span
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2"
                >
                    <Sparkles className="h-4 w-4 text-primary" />
                  Free for early users
                </motion.span>
              </Badge>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
              >
                Build. Tailor.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                  Get Hired.
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
              >
                AI-powered resume builder that tailors your CV to each job — and passes ATS checks.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                <Button 
                  size="lg" 
                  asChild
                  className={cn(
                      "text-lg px-10 py-6 bg-gradient-to-r font-medium",
                    "from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                      "text-primary-foreground shadow-2xl hover:shadow-primary/25 transition-all duration-300",
                      "border border-primary/20 backdrop-blur-sm"
                  )}
                >
                  <Link href="/auth/signup">
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    variant="outline"
                    asChild
                    className="text-lg px-10 py-6 border-2 hover:bg-muted/50 transition-all duration-300 backdrop-blur-sm bg-background/50"
                  >
                    <Link href="/templates">
                      View Templates
                    </Link>
                </Button>
                </motion.div>
              </motion.div>
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
                      <p>We&apos;re looking for a <motion.span 
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
        <div className="container px-4 mx-auto max-w-7xl">
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
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Problem</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Job applications shouldn&apos;t feel like throwing resumes into a void
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
        <div className="container px-4 mx-auto max-w-7xl">
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
      <section className="py-20 bg-gradient-to-br from-background to-muted/20">
        <div className="container px-4 mx-auto max-w-7xl">
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
              <motion.div 
                key={feature.title} 
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <Card className="h-full group hover:shadow-2xl transition-all duration-500 hover:shadow-primary/10 border-primary/20 bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <motion.div 
                      className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300"
                      whileHover={{ rotate: 5 }}
                    >
                      <feature.icon className="h-6 w-6 text-primary" />
                    </motion.div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                    <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Template Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 mx-auto max-w-7xl">
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
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands who&apos;ve landed their dream jobs
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
                    <p className="text-muted-foreground mb-4 italic">&quot;{testimonial.quote}&quot;</p>
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

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container px-4 mx-auto max-w-7xl">
          <motion.div 
            className="text-center mb-16"
            {...fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No subscriptions, no hidden fees. Pay only for what you use.
            </p>
          </motion.div>

          <motion.div 
            className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto"
            {...staggerContainer}
          >
            {/* Pricing Calculator */}
            <motion.div {...fadeInUp}>
              <PricingCalculator />
            </motion.div>

            {/* Pricing Plans */}
            <motion.div 
              className="space-y-6"
              {...fadeInUp}
            >
              {[
                {
                  name: "Free Tier",
                  price: "$0",
                  credits: "3 credits",
                  features: ["Basic resume builder", "PDF download", "Community support"],
                  cta: "Get Started",
                  href: "/auth/signup"
                },
                {
                  name: "Pay-as-you-go",
                  price: "From $0.34",
                  credits: "Buy as needed",
                  features: ["Everything in Free", "Cover letter generation", "Advanced ATS insights", "Priority support"],
                  cta: "Buy Credits",
                  href: "/app/billing",
                popular: true
              },
              { 
                  name: "Enterprise",
                  price: "Custom",
                  credits: "Unlimited",
                  features: ["Everything included", "Custom integrations", "Dedicated support", "Team management"],
                  cta: "Contact Sales",
                  href: "/contact"
              }
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={cn(
                    "relative p-6 rounded-xl border transition-all duration-300 backdrop-blur-sm",
                    plan.popular 
                      ? "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg" 
                      : "border-border/50 bg-card/50 hover:border-primary/30"
                  )}
              >
                {plan.popular && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs">
                        Popular
                  </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <div className="text-right">
                      <div className="text-xl font-bold">{plan.price}</div>
                      <div className="text-sm text-muted-foreground">{plan.credits}</div>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  
                    <Button 
                      asChild
                    size="sm"
                    className={cn(
                      "w-full",
                      plan.popular 
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    <Link href={plan.href}>
                      {plan.cta}
                    </Link>
                    </Button>
              </motion.div>
            ))}
            </motion.div>
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
              Join thousands of job seekers who&apos;ve transformed their applications with JobMatchly
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