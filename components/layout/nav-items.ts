// components/layout/nav-items.ts
//
// One definition of the app's navigation, shared by the desktop sidebar and the
// mobile drawer. Kept separate so the two can't drift — for most of this
// product's life the phone had no navigation at all, which is how the dashboard
// ended up carrying every feature on one screen.
import {
  LayoutDashboard,
  Plus,
  Upload,
  FileText,
  CreditCard,
  Star,
  Briefcase,
  Newspaper,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** Null for the first group, which needs no heading above it. */
  heading: string | null;
  items: NavItem[];
}

/**
 * Grouped by what someone is trying to do, not by what we happened to build.
 *
 * The two disabled "Soon" entries that used to sit here — Career Coach and ATS
 * Check — are gone. A permanently greyed-out row advertises a feature that does
 * not exist and takes the space a real one needs; the roadmap page still lists
 * what's planned.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    heading: null,
    items: [{ label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard }],
  },
  {
    heading: 'Find work',
    items: [
      { label: 'Jobs', href: '/app/jobs', icon: Briefcase },
      { label: 'Career articles', href: '/app/articles', icon: Newspaper },
    ],
  },
  {
    heading: 'Your documents',
    items: [
      { label: 'Create resume', href: '/app/builder/modern', icon: Plus },
      { label: 'Upload & tailor', href: '/app/upload-tailor', icon: Upload },
      { label: 'My documents', href: '/app/documents', icon: FileText },
    ],
  },
  {
    heading: 'Account',
    items: [
      { label: 'Profile', href: '/app/profile', icon: UserCircle },
      { label: 'Billing', href: '/app/billing', icon: CreditCard },
      { label: "What's coming", href: '/app/coming-soon', icon: Star },
    ],
  },
];

/** Marks a nav item active for its own page and anything nested beneath it. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
