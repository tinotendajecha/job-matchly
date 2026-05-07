'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  ChevronRight,
  Coins,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLoader from '@/components/dashboard-loader';
import { formatDistanceToNow } from 'date-fns';

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

const typeConfig = {
  create: { label: 'Created', bg: 'bg-blue-500/15', text: 'text-blue-400', icon: FileText },
  tailor: { label: 'Tailored', bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: Upload },
  cover: { label: 'Cover Letter', bg: 'bg-violet-500/15', text: 'text-violet-400', icon: FileText },
  check: { label: 'ATS Check', bg: 'bg-amber-500/15', text: 'text-amber-400', icon: CheckCircle },
};

const quickActions = [
  {
    label: 'Build from Scratch',
    description: 'Start with a clean template',
    href: '/app/builder/modern',
    icon: FileText,
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    badge: 'Live',
    badgeColor: 'bg-emerald-600 text-white',
    disabled: false,
  },
  {
    label: 'Upload & Tailor',
    description: 'Match to a job description',
    href: '/app/upload-tailor',
    icon: Upload,
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    badge: 'Live',
    badgeColor: 'bg-emerald-600 text-white',
    disabled: false,
  },
  {
    label: 'ATS Check',
    description: 'Test compatibility',
    href: '',
    icon: Target,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    badge: 'Soon',
    badgeColor: 'bg-amber-500 text-white',
    disabled: true,
  },
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
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <AppSidebar credits={userData.credits} />

        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6">

              {/* Main column */}
              <div className="space-y-5 min-w-0">

                {/* Welcome banner */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-6"
                >
                  <div className="absolute inset-0 bg-grid opacity-[0.07] pointer-events-none" />
                  <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <h1 className="text-xl font-bold font-display">
                          Welcome back{userData.name ? `, ${userData.name}` : ''}
                        </h1>
                        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-medium gap-1">
                          <Coins className="h-2.5 w-2.5" />
                          {userData.credits} credits
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ready to tailor your next application?
                      </p>
                    </div>
                    <Button asChild size="sm" className="shrink-0 font-semibold gap-1.5">
                      <Link href="/app/builder/modern">
                        <Plus className="h-4 w-4" />
                        Create Resume
                      </Link>
                    </Button>
                  </div>
                </motion.div>

                {/* Quick actions */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.06 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    const inner = (
                      <div className={cn(
                        'flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all h-full',
                        action.disabled
                          ? 'opacity-55 cursor-not-allowed'
                          : 'hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm'
                      )}>
                        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0', action.iconBg)}>
                          <Icon className={cn('h-4 w-4', action.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{action.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                        </div>
                        <Badge className={cn('text-[10px] border-0 flex-shrink-0 px-1.5', action.badgeColor)}>
                          {action.badge}
                        </Badge>
                      </div>
                    );

                    if (action.disabled) return <div key={action.label}>{inner}</div>;
                    return <Link key={action.label} href={action.href}>{inner}</Link>;
                  })}
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.12 }}
                  className="rounded-xl border border-border/60 bg-card overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-sm font-semibold">Recent Activity</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {totalPages > 1 && (
                        <span className="text-xs text-muted-foreground">{currentPage}/{totalPages}</span>
                      )}
                      <Link href="/app/documents">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground">
                          View all
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="divide-y divide-border/40">
                    {currentActivities.map((activity, index) => {
                      const cfg = typeConfig[activity.type];
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={startIndex + index}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
                        >
                          <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                            <Icon className={cn('h-3.5 w-3.5', cfg.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.item}</p>
                            <p className="text-xs text-muted-foreground">{activity.action}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] font-medium hidden sm:inline-flex border-0', cfg.bg, cfg.text)}
                          >
                            {cfg.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 hidden md:block">
                            {activity.time}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-border/60">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Prev
                      </motion.button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              'w-7 h-7 rounded-md text-xs font-medium transition-colors',
                              page === currentPage
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted/60 text-muted-foreground'
                            )}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right panel */}
              <div className="space-y-4">
                {/* Credit Usage */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.08 }}
                  className="rounded-xl border border-border/60 bg-card p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Credit Usage</h3>
                    <Link href="/app/billing">
                      <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10">
                        Add
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">This month</span>
                        <span className="font-medium tabular-nums">
                          {creditUsage.used > 0
                            ? `${creditUsage.used}/${creditUsage.total}`
                            : `${creditUsage.breakdown.resume + creditUsage.breakdown.cover} used`}
                        </span>
                      </div>
                      <Progress
                        value={creditUsage.total > 0
                          ? ((creditUsage.breakdown.tailor + creditUsage.breakdown.cover) / creditUsage.total) * 100
                          : 0}
                        className="h-1.5"
                      />
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">JD Tailoring</span>
                        <span className="font-medium tabular-nums">{creditUsage.breakdown.resume}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cover Letters</span>
                        <span className="font-medium tabular-nums">{creditUsage.breakdown.cover}</span>
                      </div>
                      <div className="flex justify-between opacity-50">
                        <span className="text-muted-foreground">Resume Builds</span>
                        <span>–</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Coming Soon */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.14 }}
                  className="rounded-xl border border-border/60 bg-card p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Coming Soon</h3>
                  </div>
                  <div className="space-y-1.5">
                    {comingSoonFeatures.slice(0, 3).map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + index * 0.07 }}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/40 transition-colors"
                      >
                        <feature.icon className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{feature.title}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{feature.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <Link href="/app/coming-soon">
                    <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs">
                      View Roadmap
                    </Button>
                  </Link>
                </motion.div>

                {/* Tip */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-4"
                >
                  <p className="text-xs font-semibold text-primary mb-1.5">Today's Tip</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use action verbs like "increased," "improved," and "led" to start your resume bullets.
                    They're more impactful than passive language.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
