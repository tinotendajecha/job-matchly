'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Lightbulb } from 'lucide-react';

import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import DashboardLoader from '@/components/dashboard-loader';

import { GreetingHero } from './components/greeting-hero';
import { QuickActions } from './components/quick-actions';
import { JobsStrip } from './components/jobs-strip';
import { CareerBriefing } from './components/career-briefing';
import { CoachCard } from './components/coach-card';
import { PlanCard, type SubData } from './components/plan-card';
import { RecentActivity, type Activity } from './components/recent-activity';
import { getDailyTip } from './data/briefing';

// Fallback data
const FALLBACK_RECENT: Activity[] = [
  { action: 'Created resume', item: 'Software Engineer Resume', time: '2 hours ago', type: 'create' },
  { action: 'Tailored to job', item: 'Google Frontend Developer', time: '1 day ago', type: 'tailor' },
  { action: 'Generated cover letter', item: 'Meta Product Designer', time: '3 days ago', type: 'cover' },
  { action: 'ATS check passed', item: 'Startup Founder Resume', time: '5 days ago', type: 'check' },
];

interface UserData {
  name: string;
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData>({ name: '' });
  const [recentActivity, setRecentActivity] = useState<Activity[]>(FALLBACK_RECENT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [subData, setSubData] = useState<SubData | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);

        // 1) Get user data + subscription status in parallel
        const [uRes, subRes] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch('/api/subscription/status', { cache: 'no-store' }),
        ]);
        const uJson = await uRes.json();
        const subJson = await subRes.json();

        if (uJson?.ok && uJson.user) {
          setUserData({
            name: uJson.user.name || '',
            subscriptionTier: uJson.subscription?.tier ?? null,
            subscriptionStatus: uJson.subscription?.status ?? null,
          });
        } else {
          toast.warn('Could not fetch user info — showing cached data.');
        }

        // subJson.subscription is null when no record exists, or an object (active or not)
        setSubData(subJson?.ok ? (subJson.subscription ?? null) : null);

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
                type,
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

  const planLabel =
    subData?.isActive && subData.tier
      ? `${subData.tier} ${subData.status === 'TRIALING' ? 'Trial' : 'plan'}`
      : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="flex">
        <AppSidebar />

        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 py-6 md:py-8 max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_340px] gap-6 2xl:gap-8">
              {/* Main column */}
              <div className="space-y-6 min-w-0">
                <GreetingHero name={userData.name} planLabel={planLabel} />
                <QuickActions />
                <JobsStrip />
                <CareerBriefing />
                <RecentActivity activities={recentActivity} />
              </div>

              {/* Right rail */}
              <div className="space-y-4">
                <CoachCard />
                <PlanCard subData={subData} />

                {/* Daily tip — rotates each day */}
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="rounded-2xl border border-border/60 bg-card p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold">Today’s Tip</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {getDailyTip()}
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
