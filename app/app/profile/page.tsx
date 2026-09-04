'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PreferencesPanel } from '@/components/profile/preferences-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  MapPin,
  FileText,
  Target,
  Mail,
  Settings,
  Save,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

interface ProfileData {
  name: string;
  email: string;
  image: string | null;
  headline: string;
  location: string;
  targetRoles: string;
  joinedAt: string;
  emailVerified: boolean;
  bracket: string | null;
}

interface Stats {
  tailored: number;
  coverLetters: number;
  created: number;
  tier: string | null;
  freeTailorsLeft: number | null;
}

interface Activity {
  id: string;
  kind: 'TAILORED_RESUME' | 'COVER_LETTER' | 'CREATED_RESUME';
  title: string;
  createdAt: string;
}

const ACTIVITY_LABEL: Record<Activity['kind'], { label: string; icon: typeof FileText }> = {
  TAILORED_RESUME: { label: 'Tailored a CV', icon: Target },
  COVER_LETTER: { label: 'Wrote a cover letter', icon: Mail },
  CREATED_RESUME: { label: 'Built a resume', icon: FileText },
};

function whenLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initialsOf(name: string, email: string): string {
  const source = name.trim() || email.split('@')[0] || '?';
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Pick<ProfileData, 'name' | 'headline' | 'location'>>({
    name: '',
    headline: '',
    location: '',
  });

  useEffect(() => {
    fetch('/api/profile/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok) throw new Error(j?.error || 'Failed to load');
        setData(j.profile);
        setStats(j.stats);
        setActivity(j.activity);
        setDraft({
          name: j.profile.name,
          headline: j.profile.headline,
          location: j.profile.location,
        });
      })
      .catch(() => toast.error('Could not load your profile'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Save failed');
      setData((d) => (d ? { ...d, ...draft } : d));
      setIsEditing(false);
      toast.success('Profile saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    if (data) setDraft({ name: data.name, headline: data.headline, location: data.location });
    setIsEditing(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold font-display">Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your account, what you&apos;ve made, and what we send you.
              </p>
            </motion.div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4" />
                        Personal information
                      </CardTitle>
                      {!loading &&
                        (!isEditing ? (
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={cancel} disabled={saving}>
                              Cancel
                            </Button>
                            <Button size="sm" onClick={save} disabled={saving}>
                              <Save className="h-4 w-4 mr-2" />
                              {saving ? 'Saving…' : 'Save'}
                            </Button>
                          </div>
                        ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading || !data ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center gap-5">
                          <Avatar className="w-16 h-16">
                            {data.image && (
                              <AvatarImage
                                src={data.image}
                                alt=""
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <AvatarFallback className="text-lg">
                              {initialsOf(data.name, data.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{data.name || 'No name set'}</p>
                            <p className="text-sm text-muted-foreground truncate">{data.email}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {data.emailVerified && (
                                <Badge variant="secondary" className="text-[10px]">
                                  <BadgeCheck className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {data.bracket && (
                                <Badge variant="outline" className="text-[10px]">
                                  {data.bracket}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Joined{' '}
                                {new Date(data.joinedAt).toLocaleDateString('en-GB', {
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full name</Label>
                            <Input
                              id="name"
                              value={draft.name}
                              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                              disabled={!isEditing}
                              placeholder="Your name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={data.email} disabled />
                            <p className="text-xs text-muted-foreground">
                              Contact support to change the address on your account.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="headline">Professional title</Label>
                            <Input
                              id="headline"
                              value={draft.headline}
                              onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
                              disabled={!isEditing}
                              placeholder="e.g. Software Developer"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={draft.location}
                              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                              disabled={!isEditing}
                              placeholder="e.g. Harare, Zimbabwe"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!loading && stats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Your plan</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {stats.tier ? `${stats.tier.charAt(0)}${stats.tier.slice(1).toLowerCase()}` : 'Free'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {stats.tier
                            ? 'Tailoring, cover letters and downloads are included.'
                            : stats.freeTailorsLeft && stats.freeTailorsLeft > 0
                              ? `You have ${stats.freeTailorsLeft} free tailored CV left.`
                              : "You've used your free tailored CV. Subscribe to keep tailoring."}
                        </p>
                      </div>
                      <Button asChild variant={stats.tier ? 'outline' : 'default'} size="sm" className="flex-shrink-0">
                        <Link href={stats.tier ? '/app/billing' : '/pricing'}>
                          {stats.tier ? 'Manage billing' : 'See plans'}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {loading || !stats
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-[104px] rounded-xl" />
                      ))
                    : [
                        { label: 'CVs tailored', value: stats.tailored, icon: Target },
                        { label: 'Cover letters', value: stats.coverLetters, icon: Mail },
                        { label: 'Resumes built', value: stats.created, icon: FileText },
                      ].map((s) => (
                        <Card key={s.label}>
                          <CardContent className="p-5 text-center">
                            <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
                            <p className="text-sm text-muted-foreground">{s.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-14 w-full" />
                        ))}
                      </div>
                    ) : activity.length > 0 ? (
                      <div className="space-y-1">
                        {activity.map((a, i) => {
                          const meta = ACTIVITY_LABEL[a.kind] ?? ACTIVITY_LABEL.CREATED_RESUME;
                          return (
                            <motion.div
                              key={a.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: Math.min(i * 0.04, 0.3) }}
                            >
                              <Link
                                href={`/app/documents/${a.id}`}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                              >
                                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <meta.icon className="h-4 w-4 text-primary" />
                                </span>
                                <span className="flex-1 min-w-0">
                                  <span className="block text-sm font-medium">{meta.label}</span>
                                  <span className="block text-xs text-muted-foreground truncate">
                                    {a.title}
                                  </span>
                                </span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {whenLabel(a.createdAt)}
                                </span>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center">
                        <Sparkles className="mx-auto h-7 w-7 text-muted-foreground" />
                        <p className="mt-3 font-medium">Nothing here yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Tailor a CV to a job and it&apos;ll show up here.
                        </p>
                        <Button asChild size="sm" className="mt-4">
                          <Link href="/app/jobs">Find a job to apply for</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6 mt-6">
                <PreferencesPanel />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      You can ask us for a copy of everything we hold about you, or to delete your
                      account and its data. Email{' '}
                      <a
                        href="mailto:hello@jobmatchly.site"
                        className="text-foreground underline underline-offset-2"
                      >
                        hello@jobmatchly.site
                      </a>{' '}
                      and we&apos;ll action it.
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        What we collect and why is set out in the{' '}
                        <Link href="/terms" className="text-foreground underline underline-offset-2">
                          Data Protection &amp; Consent Agreement
                        </Link>
                        .
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
