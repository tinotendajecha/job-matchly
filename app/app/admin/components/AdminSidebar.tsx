'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, FileText, TrendingUp, Settings, X, ChevronLeft, ChevronRight, Newspaper, Send, Archive, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/app/admin/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/admin/users', label: 'Users', icon: Users },
  { href: '/app/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/app/admin/documents', label: 'Documents', icon: FileText },
  { href: '/app/admin/content', label: 'Content', icon: Newspaper },
  { href: '/app/admin/jobs', label: 'Job archive', icon: Archive },
  { href: '/app/admin/shares', label: 'Job sharing', icon: Share2 },
  { href: '/app/admin/broadcast', label: 'Broadcast', icon: Send },
  { href: '/app/admin/conversion', label: 'Conversion', icon: TrendingUp },
  { href: '/app/admin/system', label: 'System', icon: Settings },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close on Escape, and stop the page behind the drawer scrolling with it.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex fixed top-0 left-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 flex-col',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className={cn('p-6 border-b border-border', isCollapsed && 'p-4')}>
          {!isCollapsed ? (
            <h1 className="text-xl font-bold text-foreground truncate">JobMatchly Admin</h1>
          ) : (
            <div className="flex items-center justify-center">
              <span className="text-xl font-bold text-primary">JM</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group relative',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  isCollapsed && 'justify-center'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={cn('p-4 border-t border-border', isCollapsed && 'text-center')}>
          {!isCollapsed && (
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} JobMatchly</p>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 p-1.5 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-md"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile Overlay — before the drawer so the drawer always paints above it */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-[100dvh] w-[min(17rem,85vw)] bg-card border-r border-border transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="flex flex-col h-full">
          {/* Brand and close button share a row, so neither can cover the other */}
          <div className="flex items-center justify-between gap-2 h-16 px-4 border-b border-border">
            <h1 className="text-lg font-bold text-foreground truncate">JobMatchly Admin</h1>
            <button
              onClick={onMobileClose}
              className="flex-shrink-0 p-2 -mr-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} JobMatchly</p>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop collapsed/expanded state */}
      <div className={cn('hidden lg:block flex-shrink-0 transition-all duration-300', isCollapsed ? 'w-16' : 'w-64')} />
    </>
  );
}
