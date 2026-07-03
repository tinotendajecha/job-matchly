'use client';

import Link from 'next/link';
import { FileText, Upload, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const actions = [
  {
    label: 'Build from Scratch',
    description: 'Start with a clean template and craft your resume with AI assistance.',
    href: '/app/builder/modern',
    icon: FileText,
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-500 dark:text-blue-400',
    wash: 'from-blue-500/[0.07]',
  },
  {
    label: 'Upload & Tailor',
    description: 'Upload your existing resume and tailor it to any job description instantly.',
    href: '/app/upload-tailor',
    icon: Upload,
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    wash: 'from-primary/[0.07]',
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.label} href={action.href} className="group">
            <div
              className={cn(
                'relative overflow-hidden flex flex-col gap-5 rounded-2xl border border-border/60 bg-card p-6 h-full transition-all',
                'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5'
              )}
            >
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
                  action.wash
                )}
              />
              <div className="relative flex items-start justify-between">
                <div
                  className={cn(
                    'h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0',
                    action.iconBg
                  )}
                >
                  <Icon className={cn('h-5 w-5', action.iconColor)} />
                </div>
                <div className="h-8 w-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground transition-all group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <div className="relative">
                <p className="text-lg font-semibold font-display mb-1">{action.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
}
