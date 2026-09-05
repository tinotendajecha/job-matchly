'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_GROUPS, isNavItemActive } from './nav-items';

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-52 xl:w-56 2xl:w-64 shrink-0 sticky top-16 h-[calc(100vh-64px)] border-r border-border/60">
      <nav className="flex-1 px-2 xl:px-3 pt-5 pb-4 overflow-y-auto">
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
                      'flex items-center gap-2.5 w-full rounded-lg px-3 py-2 xl:py-2.5 text-sm transition-all',
                      active
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
