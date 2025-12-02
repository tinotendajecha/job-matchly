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
  Star,
  ChevronLeft,
  ChevronRight
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

// Fallback data
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Calculate pagination
  const totalPages = Math.ceil(recentActivity.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentActivities = recentActivity.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);

        // 1) Get user data
        const uRes = await fetch('/api/auth/me', { cache: 'no-store' });
        const uJson = await uRes.json();
        if (uJson?.ok && uJson.user) {
          setUserData({ name: uJson.user.name || '', credits: uJson.user.credits ?? 0 });
        } else {
          setIsError(true);
          toast.warn('Could not fetch user info — showing cached data.');
        }

        // 2) Get recent documents
        try {
          const docsRes = await fetch('/api/documents/recent?limit=8', { cache: 'no-store' });
          const docsJson = await docsRes.json();
          if (docsJson?.ok && Array.isArray(docsJson.documents)) {
            const mapped = docsJson.documents.map((d: any) => {
              const kind = d.kind as string;
              const type = kind === 'COVER_LETTER' ? 'cover' : kind === 'TAILORED_RESUME' ? 'tailor' : 'create';
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
            setRecentActivity(FALLBACK_RECENT);
          }
        } catch (err) {
          console.warn('Failed to fetch documents/recent', err);
          setRecentActivity(FALLBACK_RECENT);
        }

        // 3) Get ledger summary
        try {
          const ledgerRes = await fetch('/api/ledger/summary', { cache: 'no-store' });
          const ledgerJson = await ledgerRes.json();
          if (ledgerJson?.ok && ledgerJson.summary) {
            const s = ledgerJson.summary;
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
            console.warn('ledger summary not ok, using fallback');
          }
        } catch (err) {
          console.warn('Failed to fetch ledger/summary', err);
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      <div className="w-full max-w-[100vw]">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-5 md:space-y-6 w-full min-w-0">
              {/* Welcome Card */}
              <motion.div {...fadeInUp}>
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 w-full">
                  <CardContent className="p-4 sm:p-5 md:p-6">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 break-words">
                      Welcome back, {userData.name}👋
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                      You have {userData.credits} credits remaining. Ready to tailor your next application?
                    </p>
                    <Button asChild className="w-full sm:w-auto text-sm sm:text-base">
                      <Link href="/app/builder/modern">
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                        Create Your First Resume
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Primary Actions - Single column on mobile */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {/* Build from Scratch */}
                <motion.div whileHover={{ y: -5 }} className="group relative w-full">
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-emerald-600 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full shadow-md">
                      New
                    </span>
                  </div>

                  <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300">
                    <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                      </div>
                      <CardTitle className="text-base sm:text-lg">Build from Scratch</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Start with a clean template and build your resume step by step
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 p-4 sm:p-6">
                      <Button className="w-full text-sm" variant="outline" asChild>
                        <Link href="/app/builder/modern">Start Building</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Upload & Tailor */}
                <motion.div whileHover={{ y: -5 }} className="group relative w-full">
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-amber-600 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full shadow-md">
                      Under Maintenance
                    </span>
                  </div>

                  <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300">
                    <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                        <Upload className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                      </div>
                      <CardTitle className="text-base sm:text-lg">Upload & Tailor</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Upload your existing resume and tailor it to a specific job
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 p-4 sm:p-6">
                      <Button className="w-full text-sm opacity-60" variant="outline" disabled>
                        Tailor Resume
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* ATS Check */}
                <motion.div whileHover={{ y: -5 }} className="group relative w-full sm:col-span-2 md:col-span-1">
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-yellow-500 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full shadow-md">
                      Coming Soon
                    </span>
                  </div>

                  <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 opacity-70 pointer-events-none">
                    <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                        <Target className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                      </div>
                      <CardTitle className="text-base sm:text-lg">ATS Check</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Test any resume for ATS compatibility and get improvement tips
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 p-4 sm:p-6">
                      <Button className="w-full text-sm" variant="outline" disabled>
                        Check ATS
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Recent Activity with Pagination */}
              <motion.div {...fadeInUp}>
                <Card className="w-full">
                  <CardHeader className="p-4 sm:p-5 md:p-6 pb-3 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span>Recent Activity</span>
                      </CardTitle>
                      {totalPages > 1 && (
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                    <div className="space-y-3 sm:space-y-4">
                      {currentActivities.map((activity, index) => (
                        <motion.div
                          key={startIndex + index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start sm:items-center gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div
                            className={cn(
                              'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0',
                              activity.type === 'create' && 'bg-blue-100 dark:bg-blue-900',
                              activity.type === 'tailor' && 'bg-green-100 dark:bg-green-900',
                              activity.type === 'cover' && 'bg-purple-100 dark:bg-purple-900',
                              activity.type === 'check' && 'bg-orange-100 dark:bg-orange-900'
                            )}
                          >
                            {activity.type === 'create' && <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                            {activity.type === 'tailor' && <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                            {activity.type === 'cover' && <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                            {activity.type === 'check' && <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">{activity.action}</p>
                            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{activity.item}</p>
                          </div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {activity.time}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t">
                        {/* Previous Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className={cn(
                            'group flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200',
                            'bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10',
                            'disabled:opacity-40 disabled:cursor-not-allowed',
                            'border border-primary/20 hover:border-primary/30',
                            'min-h-[40px] sm:min-h-[44px]'
                          )}
                        >
                          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                          <span className="text-xs sm:text-sm hidden sm:inline">Prev</span>
                        </motion.button>

                        {/* Page Indicators - Desktop/Tablet only */}
                        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <motion.button
                              key={page}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setCurrentPage(page)}
                              className={cn(
                                'w-8 h-8 sm:w-9 sm:h-9 rounded-full font-medium text-xs sm:text-sm transition-all duration-200',
                                page === currentPage
                                  ? 'bg-primary text-primary-foreground shadow-md'
                                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                              )}
                            >
                              {page}
                            </motion.button>
                          ))}
                        </div>

                        {/* Mobile Page Counter */}
                        <div className="sm:hidden text-xs text-muted-foreground font-medium px-2">
                          {currentPage} / {totalPages}
                        </div>

                        {/* Next Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={cn(
                            'group flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-200',
                            'bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20',
                            'disabled:opacity-40 disabled:cursor-not-allowed',
                            'border border-primary/20 hover:border-primary/30',
                            'min-h-[40px] sm:min-h-[44px]'
                          )}
                        >
                          <span className="text-xs sm:text-sm hidden sm:inline">Next</span>
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </motion.button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 sm:space-y-5 md:space-y-6 w-full min-w-0">
              {/* Credit Usage */}
              <motion.div {...fadeInUp}>
                <Card className="w-full">
                  <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-5 md:p-6">
                    <CardTitle className="text-base sm:text-lg">Credit Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-5 md:p-6 pt-0">
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-2">
                        <span>This month</span>
                        <span className="text-right truncate ml-2">
                          {creditUsage.used > 0
                            ? `${creditUsage.used}/${creditUsage.total} used`
                            : `${creditUsage.breakdown.resume + creditUsage.breakdown.cover} used`}
                        </span>
                      </div>
                      <Progress
                        value={((creditUsage.breakdown.tailor + creditUsage.breakdown.cover) / creditUsage.total) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground truncate mr-2">JD Tailoring</span>
                        <span className="font-medium flex-shrink-0">{creditUsage.breakdown.resume}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground truncate mr-2">Cover Letters</span>
                        <span className="font-medium flex-shrink-0">{creditUsage.breakdown.cover}</span>
                      </div>
                      <div className="flex justify-between items-center opacity-60">
                        <span className="text-muted-foreground text-[11px] sm:text-xs truncate mr-2">Resume Builds (Soon)</span>
                        <span className="flex-shrink-0">-</span>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm" asChild>
                      <Link href="/app/billing">Add Credits</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Coming Soon */}
              <motion.div {...fadeInUp}>
                <Card className="w-full">
                  <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-5 md:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span>Coming Soon</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-5 md:p-6 pt-0">
                    {comingSoonFeatures.slice(0, 3).map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2.5 sm:gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <feature.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-medium truncate">{feature.title}</p>
                          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm mt-2" asChild>
                      <Link href="/app/coming-soon">View Roadmap</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Tips */}
              <motion.div {...fadeInUp}>
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 w-full">
                  <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-5 md:p-6">
                    <CardTitle className="text-base sm:text-lg">💡 Today's Tip</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 md:p-6 pt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
    </div>
  );
}
