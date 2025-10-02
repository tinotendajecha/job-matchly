'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Settings,
  CreditCard,
  LogOut,
  FileText,
  Coins,
  Sun,
  Moon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';

import { useTailorStore } from '@/lib/zustand/store';

interface HeaderProps {
  isPublic?: boolean;
}

type Me = {
  id: string;
  email: string | null;
  name: string | null;
  credits: number;
};

function initialsFrom(name?: string | null, email?: string | null) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] || '';
    const b = parts[1]?.[0] || '';
    return (a + b).toUpperCase() || 'U';
  }
  if (email) return email[0]?.toUpperCase() || 'U';
  return 'U';
}

export function Header({ isPublic = false }: HeaderProps) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  // get resetAll from store
  const resetAll = useTailorStore((s) => s.resetAll);

  // ---- Dark/Light toggle (no system) ----
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('jm_theme')) as
      | 'light'
      | 'dark'
      | null;
    const initial = saved === 'dark' ? 'dark' : 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('jm_theme', next);
    } catch {}
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  // ---- Load / refresh current user (credits, etc) ----
  useEffect(() => {
    if (isPublic) return;

    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!mounted) return;
        if (res.ok) {
          const j = await res.json();
          setMe(j.user);
        } else {
          setMe(null);
        }
      } catch {
        if (mounted) setMe(null);
      }
    };

    load();
    const onFocus = () => load();
    window.addEventListener('visibilitychange', onFocus);
    window.addEventListener('focus', onFocus);
    return () => {
      mounted = false;
      window.removeEventListener('visibilitychange', onFocus);
      window.removeEventListener('focus', onFocus);
    };
  }, [isPublic]);

  const credits = useMemo(() => me?.credits ?? 0, [me]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout failed');
      toast.success('Logged out');
      resetAll();
      setMe(null);
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Could not log out. Try again.');
    }
  };

  const isAuthed = !!me;

  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* Brand */}
        <Link
          href={isAuthed ? '/app/dashboard' : '/'}
          className="flex items-center gap-2"
        >
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText className="h-4 w-4 text-primary-foreground" />
          </motion.div>
          <span className="text-lg sm:text-xl font-bold">JobMatchly</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/templates"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Templates
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Pricing
          </Link>
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!isPublic && isAuthed && (
            <motion.div whileHover={{ scale: 1.05 }} className="hidden sm:block">
              <Badge variant="outline" className="gap-1">
                <Coins className="h-3 w-3" />
                {credits} credits
              </Badge>
            </motion.div>
          )}

          {/* Dark/Light toggle (no system) */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle color theme"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Auth area */}
          {isPublic || !isAuthed ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" asChild className="h-9 px-3">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              {/* <Button
                asChild
                className={cn(
                  'h-9 px-3 bg-gradient-to-r font-medium',
                  'light:from-[#A4FF3C] light:to-[#8AE324] light:text-black light:hover:from-[#8AE324] light:hover:to-[#7DD121]',
                  'dark:from-[#FF6B2C] dark:to-[#FF5722] dark:text-white dark:hover:from-[#FF5722] dark:hover:to-[#FF3D00]'
                )}
              >
                <Link href="/auth/signup">Start Free</Link>
              </Button> */}
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initialsFrom(me?.name, me?.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="space-y-1">
                  <div className="font-medium truncate">{me?.name || 'Your Account'}</div>
                  <div className="text-xs text-muted-foreground truncate">{me?.email}</div>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
                    <Coins className="h-3 w-3" />
                    {credits} credits
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* <DropdownMenuItem asChild>
                  <Link href="/app/profile" className="flex cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem> */}

                <DropdownMenuItem asChild>
                  <Link href="/app/billing" className="flex cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                </DropdownMenuItem>
{/* 
                <DropdownMenuItem asChild>
                  <Link href="/app/settings" className="flex cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem> */}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.header>
  );
}
