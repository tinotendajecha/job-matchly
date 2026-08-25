'use client';

import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

/**
 * Owns the mobile drawer state so the toggle can live INSIDE the header rather
 * than floating over the page. The old fixed-position button collided with
 * whatever sat at the top-left: the header title when closed, and the sidebar's
 * own "JobMatchly Admin" heading when open.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 w-full">{children}</main>
      </div>
    </div>
  );
}
