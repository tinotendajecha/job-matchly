'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Upload, 
  Target, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Users,
  Briefcase,
  MapPin,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { set } from 'date-fns';
import { toast } from 'react-toastify';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const recentActivity = [
  { action: 'Created resume', item: 'Software Engineer Resume', time: '2 hours ago', type: 'create' },
  { action: 'Tailored to job', item: 'Google Frontend Developer', time: '1 day ago', type: 'tailor' },
  { action: 'Generated cover letter', item: 'Meta Product Designer', time: '3 days ago', type: 'cover' },
  { action: 'ATS check passed', item: 'Startup Founder Resume', time: '5 days ago', type: 'check' },
];

const comingSoonFeatures = [
  { title: 'Internship Finder', description: 'Discover paid internships matched to your skills', icon: Users },
  { title: 'Scholarship Search', description: 'Find funding opportunities for your education', icon: Star },
  { title: 'Job Board', description: 'Apply directly through JobMatchly', icon: Briefcase },
  { title: 'Referral Network', description: 'Connect with alumni in your target companies', icon: MapPin },
];

export default function DashboardPage() {

  interface user {
    name: String;
  }

  const [userData, setUserData] = useState<user>({name: ""});
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isError, setIsError] = useState<boolean>(false)

  // Fetch user data from /api/auth/me 
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await res.json();
        if (data.ok) {
          setUserData(data.user);
          setIsLoading(false);
        } else {
          setIsError(true);
          setIsLoading(false);
          toast.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    fetchUserData();
  },[])

  if(isLoading) {
    // Make a fancy loader here
    return(
      <div>
        Loading page..
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Welcome */}
            <motion.div {...fadeInUp}>
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="p-6">
                  <h1 className="text-2xl font-bold mb-2">Welcome back, {userData.name}👋</h1>
                  <p className="text-muted-foreground mb-4">
                    You have 127 credits remaining. Ready to tailor your next application?
                  </p>
                  <Button asChild>
                    <Link href="/app/builder/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Start New Resume
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Primary Actions */}
            <motion.div 
              className="grid md:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div whileHover={{ y: -5 }} className="group">
                <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Build from Scratch</CardTitle>
                    <CardDescription>
                      Start with a clean template and build your resume step by step
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button className="w-full" asChild>
                      <Link href="/app/builder/new">Start Building</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="group">
                <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Upload & Tailor</CardTitle>
                    <CardDescription>
                      Upload your existing resume and tailor it to a specific job
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button className="w-full" variant="outline" asChild>
                      <Link href="/app/upload-tailor">Upload Resume</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="group">
                <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>ATS Check</CardTitle>
                    <CardDescription>
                      Test any resume for ATS compatibility and get improvement tips
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button className="w-full" variant="outline" asChild>
                      <Link href="/app/upload-tailor">Check ATS</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div {...fadeInUp}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          activity.type === 'create' && "bg-blue-100 dark:bg-blue-900",
                          activity.type === 'tailor' && "bg-green-100 dark:bg-green-900",
                          activity.type === 'cover' && "bg-purple-100 dark:bg-purple-900",
                          activity.type === 'check' && "bg-orange-100 dark:bg-orange-900"
                        )}>
                          {activity.type === 'create' && <FileText className="h-4 w-4" />}
                          {activity.type === 'tailor' && <Target className="h-4 w-4" />}
                          {activity.type === 'cover' && <FileText className="h-4 w-4" />}
                          {activity.type === 'check' && <CheckCircle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.item}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Usage Meter */}
            <motion.div {...fadeInUp}>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Credit Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>This month</span>
                      <span>23/150 used</span>
                    </div>
                    <Progress value={15.3} className="h-2" />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resume builds</span>
                      <span>8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">JD tailoring</span>
                      <span>12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cover letters</span>
                      <span>3</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/app/billing">Add Credits</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Coming Soon */}
            <motion.div {...fadeInUp}>
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Coming Soon
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {comingSoonFeatures.slice(0, 3).map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <feature.icon className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/app/coming-soon">View Roadmap</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Tips */}
            <motion.div {...fadeInUp}>
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">💡 Today's Tip</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Use action verbs like "increased," "improved," and "led" to start your resume bullets. 
                    They're more impactful than passive language.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}