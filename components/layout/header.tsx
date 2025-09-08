'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  Settings, 
  CreditCard, 
  LogOut, 
  FileText,
  Coins
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isPublic?: boolean;
}

export function Header({ isPublic = false }: HeaderProps) {
  return (
    <motion.header 
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText className="h-4 w-4 text-primary-foreground" />
          </motion.div>
          <span className="text-xl font-bold">JobMatchly</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
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

        <div className="flex items-center space-x-4">
          {!isPublic && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="hidden sm:block"
            >
              <Badge variant="outline" className="gap-1">
                <Coins className="h-3 w-3" />
                127 credits
              </Badge>
            </motion.div>
          )}
          
          <ThemeToggle />

          {isPublic ? (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild className={cn(
                "bg-gradient-to-r font-medium",
                "light:from-[#A4FF3C] light:to-[#8AE324] light:text-black light:hover:from-[#8AE324] light:hover:to-[#7DD121]",
                "dark:from-[#FF6B2C] dark:to-[#FF5722] dark:text-white dark:hover:from-[#FF5722] dark:hover:to-[#FF3D00]"
              )}>
                <Link href="/auth/signup">Start Free</Link>
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem asChild>
                  <Link href="/app/profile" className="flex cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/billing" className="flex cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
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