'use client';

import { Bell, LogOut, User, LayoutDashboard, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-card border-b border-border">
      <div className="flex items-center justify-between h-full gap-3 px-4 sm:px-6 lg:px-8">
        {/* In normal flow — a floating button here used to sit on top of the title */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -ml-2 flex-shrink-0"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {/* The sidebar carries the brand on large screens; on mobile it's hidden
              behind the drawer, so the header shows it instead. */}
          <span className="lg:hidden font-bold text-foreground truncate">JobMatchly</span>
          <h2 className="hidden lg:block text-lg font-semibold text-foreground">Admin Dashboard</h2>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">AD</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">Admin</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem><DropdownMenuItem>
                <Link href="/app/dashboard" className='flex items-center'>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>User Dashboard</span></Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
