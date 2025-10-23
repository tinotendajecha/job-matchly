'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Upload,
  Target,
  Plus,
  Clock,
  CheckCircle,
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
import { toast } from 'react-toastify';
import DashboardLoader from '@/components/dashboard-loader';
import { formatDistanceToNow } from 'date-fns';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

// Keep your original fallback hardcoded recent activity (used if fetch fails)
const FALLBACK_RECENT: { action: string; item: string; time: string; type: 'create' | 'tailor' | 'cover' | 'check' }[] = [
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
    name: string;
    credits: number;
  }

  interface Activity {
    action: string;
    item: string;
    time: string;
    type: 'create' | 'tailor' | 'cover' | 'check';
  }

  const [userData, setUserData] = useState<user>({ name: '', credits: 0 });
  const [recentActivity, setRecentActivity] = useState<Activity[]>(FALLBACK_RECENT);
  const [creditUsage, setCreditUsage] = useState({
    used: 23,
    total: 150,
    breakdown: { resume: 8, tailor: 12, cover: 3 }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);

        // 1) get user (same as before)
        const uRes = await fetch('/api/auth/me', { cache: 'no-store' });
        const uJson = await uRes.json();
        if (uJson?.ok && uJson.user) {
          setUserData({ name: uJson.user.name || '', credits: uJson.user.credits ?? 0 });
        } else {
          // leave fallback userData if any, but flag error
          setIsError(true);
          toast.warn('Could not fetch user info — showing cached data.');
        }

        // 2) get recent documents (from server route /api/documents/recent)
        try {
          const docsRes = await fetch('/api/documents/recent?limit=8', { cache: 'no-store' });
          const docsJson = await docsRes.json();
          if (docsJson?.ok && Array.isArray(docsJson.documents)) {
            // map documents into your activity items (most recent first)
            const mapped = docsJson.documents.map((d: any) => {
              const kind = d.kind as string;
              const type = kind === 'COVER_LETTER' ? 'cover' : kind === 'TAILORED_RESUME' ? 'tailor' : 'create';
              // friendly time: use createdAt -> "2 hours ago"
              const time = d.createdAt ? formatDistanceToNow(new Date(d.createdAt), { addSuffix: true }) : 'just now';
              return {
                action:
                  type === 'create'
                    ? 'Created resume'
                    : type === 'tailor'
                      ? 'Tailored to job'
                      : type === 'cover'
                        ? 'Generated cover letter'
                        : 'Activity',
                item: d.title || 'Untitled',
                time,
                type
              } as Activity;
            });
            setRecentActivity(mapped.length ? mapped : FALLBACK_RECENT);
          } else {
            // keep fallback if response not ok
            setRecentActivity(FALLBACK_RECENT);
          }
        } catch (err) {
          console.warn('Failed to fetch documents/recent', err);
          setRecentActivity(FALLBACK_RECENT);
        }

        // 3) get ledger summary (credit usage) from /api/ledger/summary
        try {
          const ledgerRes = await fetch('/api/ledger/summary', { cache: 'no-store' });
          const ledgerJson = await ledgerRes.json();
          if (ledgerJson?.ok && ledgerJson.summary) {
            const s = ledgerJson.summary;
            // try to read totals.totals or breakdown mapping if available
            const totals = s.totals || { resumes: 0, tailorings: 0, coverLetters: 0 };
            const used = s.creditsThisMonth ?? ((totals.resumes || 0) + (totals.tailorings || 0) + (totals.coverLetters || 0));
            setCreditUsage({
              used: totals.used ?? 0,
              total: s.monthLimit ?? 150,
              breakdown: {
                resume: totals.resumes ?? 0,
                tailor: (totals.tailorings ?? totals.tailor) || 0,
                cover: (totals.coverLetters ?? totals.cover) || 0
              }
            });
          } else {
            // keep fallback; don't crash UI
            console.warn('ledger summary not ok, using fallback');
          }
        } catch (err) {
          console.warn('Failed to fetch ledger/summary', err);
          // keep fallback
        }
      } catch (err) {
        console.error('Dashboard fetch error', err);
        toast.error('Error loading dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (isLoading) {
    return (
      <div>
        <DashboardLoader />
      </div>
    );
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
                    You have {userData.credits} credits remaining. Ready to tailor your next application?
                  </p>
                  <Button asChild>
                    <Link href="/app/upload-tailor">
                      <Plus className="h-4 w-4 mr-2" />
                      Tailor Your First Resume
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
              <motion.div whileHover={{ y: -5 }} className="group relative">
                {/* Coming Soon badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                    Coming Soon
                  </span>
                </div>

                <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 opacity-70 pointer-events-none">
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
                    <Button className="w-full" disabled>
                      Start Building
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="group relative">
                {/* Live badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                    Live
                  </span>
                </div>

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

              <motion.div whileHover={{ y: -5 }} className="group relative">
                {/* Coming Soon badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                    Coming Soon
                  </span>
                </div>

                <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 opacity-70 pointer-events-none">
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
                    <Button className="w-full" variant="outline" disabled>
                      Check ATS
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
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          activity.type === 'create' && 'bg-blue-100 dark:bg-blue-900',
                          activity.type === 'tailor' && 'bg-green-100 dark:bg-green-900',
                          activity.type === 'cover' && 'bg-purple-100 dark:bg-purple-900',
                          activity.type === 'check' && 'bg-orange-100 dark:bg-orange-900'
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
                      <span>
                        {creditUsage.used > 0
                          ? `${creditUsage.used} / ${creditUsage.total} used`
                          : `You’ve used ${creditUsage.breakdown.resume + creditUsage.breakdown.cover} credits`}
                      </span>
                    </div>
                    <Progress
                      value={((creditUsage.breakdown.tailor + creditUsage.breakdown.cover) / creditUsage.total) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">JD Tailoring</span>
                      <span>{creditUsage.breakdown.resume}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cover Letters</span>
                      <span>{creditUsage.breakdown.cover}</span>
                    </div>
                    <div className="flex justify-between opacity-60">
                      <span className="text-muted-foreground">Resume Builds (Coming Soon)</span>
                      <span>-</span>
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
