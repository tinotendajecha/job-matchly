'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NAV_GROUPS, isNavItemActive } from './nav-items';

/**
 * Navigation for phones and tablets.
 *
 * Until this existed, a signed-in user below the `lg` breakpoint could not
 * reach Jobs, Documents, Create resume or Upload & tailor at all — the sidebar
 * is desktop-only and the header carried marketing links. On a product used
 * mostly from phones, that made the dashboard the whole app.
 */
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // The drawer renders into document.body rather than where it sits in the
  // tree. The header sets backdrop-blur, and backdrop-filter makes an element
  // the containing block for fixed-position descendants — so `fixed inset-0`
  // was measured against the header bar, producing a drawer one header tall
  // with the page showing through beneath it.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Route changes come from tapping a link in here, so the drawer has to close
  // itself or it covers the page it just opened.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // A drawer over a page that still scrolls behind it feels broken on touch.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const drawer = (
    <div className="lg:hidden fixed inset-0 z-[60]">
      <button
        aria-label="Close menu"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <div className="absolute inset-y-0 left-0 w-[82%] max-w-xs bg-card border-r border-border shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 h-16 border-b border-border/60 flex-shrink-0">
          <span className="font-bold font-display">
            Job<span className="text-primary">Matchly</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.heading ?? 'top'} className={gi > 0 ? 'mt-5' : ''}>
              {group.heading && (
                <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.heading}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavItemActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        // Comfortably past the 44px touch target minimum.
                        'flex items-center gap-3 w-full rounded-lg px-3 py-3 text-sm transition-colors',
                        active
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9 rounded-lg"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {mounted && open && createPortal(drawer, document.body)}
    </>
  );
}
