'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Plus, Upload, FileText, Target, Coins, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Create Resume', href: '/app/builder/modern', icon: Plus },
  { label: 'Upload & Tailor', href: '/app/upload-tailor', icon: Upload },
  { label: 'My Documents', href: '/app/documents', icon: FileText },
  { label: 'ATS Check', href: '', icon: Target, disabled: true, badge: 'Soon' },
  { label: 'Billing', href: '/app/billing', icon: Coins },
  { label: 'Roadmap', href: '/app/coming-soon', icon: Star },
];

interface AppSidebarProps {
  credits?: number;
}

export function AppSidebar({ credits }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-52 shrink-0 sticky top-16 h-[calc(100vh-64px)] border-r border-border/60">
      <nav className="flex-1 px-2 pt-5 pb-4 space-y-0.5 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isDisabled = item.disabled;

          const cls = cn(
            'flex items-center justify-between gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-all',
            isActive
              ? 'bg-primary/10 text-primary font-semibold'
              : isDisabled
                ? 'text-muted-foreground/40 cursor-not-allowed pointer-events-none'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          );

          const content = (
            <>
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge && (
                <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground flex-shrink-0">
                  {item.badge}
                </span>
              )}
              {isActive && !item.badge && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              )}
            </>
          );

          if (isDisabled) {
            return (
              <div key={item.label} className={cls}>
                {content}
              </div>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={cls}>
              {content}
            </Link>
          );
        })}
      </nav>

      {typeof credits !== 'undefined' && (
        <div className="px-3 py-4 border-t border-border/60">
          <div className="rounded-lg bg-muted/40 px-3 py-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Coins className="h-3 w-3" />
                Credits
              </span>
              <span className="text-xs font-bold text-primary">{credits}</span>
            </div>
            <Link
              href="/app/billing"
              className="block text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Add more credits →
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
