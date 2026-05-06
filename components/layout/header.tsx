'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
import { CreditCard, LogOut, Coins, Sun, Moon, Zap, Crown } from 'lucide-react';
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
  isAdmin: boolean;
  market?: 'ZW' | 'ZA';
};

function initialsFrom(name?: string | null, email?: string | null) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'U';
  }
  return email?.[0]?.toUpperCase() || 'U';
}

export function Header({ isPublic = false }: HeaderProps) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const resetAll = useTailorStore((s) => s.resetAll);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isPublic) return;
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        if (!mounted) return;
        if (res.ok) setMe((await res.json()).user);
        else setMe(null);
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
  const isAuthed = !!me;
  const showCreditsBadge = Boolean(!isPublic && isAuthed && me?.market !== 'ZA');
  const creditsLabel = `${credits} credits`;

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

  return (
    <motion.header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled || !isPublic
          ? 'border-b border-border/60 bg-background/95 backdrop-blur-xl'
          : 'bg-transparent',
      )}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        {/* Brand */}
        <Link
          href={isAuthed ? '/app/dashboard' : '/'}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-transform duration-200 group-hover:scale-105">
            <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold tracking-tight font-display">JobMatchly</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/templates', label: 'Templates' },
            { href: '/pricing', label: 'Pricing' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:text-foreground hover:bg-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {showCreditsBadge && (
            <Badge variant="outline" className="gap-1.5 hidden sm:flex border-primary/30 bg-primary/5 text-primary">
              <Coins className="h-3 w-3" />
              <span className="text-xs font-medium">{creditsLabel}</span>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle color theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 rounded-lg"
          >
            {theme === 'dark'
              ? <Sun className="h-4 w-4" />
              : <Moon className="h-4 w-4" />
            }
          </Button>

          {isPublic || !isAuthed ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="h-9 px-3 hidden sm:flex text-sm">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild className="h-9 px-4 font-semibold text-sm">
                <Link href="/auth/signup">Start Free</Link>
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
                      {initialsFrom(me?.name, me?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="space-y-1">
                  <div className="font-semibold truncate">{me?.name || 'Your Account'}</div>
                  <div className="text-xs text-muted-foreground truncate">{me?.email}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <Coins className="h-3 w-3" />
                    {creditsLabel}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {me?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/app/admin" className="flex cursor-pointer items-center">
                      <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/app/billing" className="flex cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.header>
  );
}
