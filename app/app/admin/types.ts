export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  newSignupsToday: number;
  newSignupsYesterday: number;
  totalDocuments: number;
  documentsToday: number;
  documentsYesterday: number;
  activationRate: number;
  churnRate: number;
  freeUsers: number;
  /** COMPLETED download unlock or ACTIVE subscription — NOT "any PAID purchase". */
  payingCustomers: number;
  /** Users holding SYSTEM_BONUS grants. Reported separately; these are not customers. */
  bonusGrantUsers: number;
  avgDocsPerUser: number;
  activeSubscribersByTier: Array<{ tier: string; count: number }>;
  trialingSubscribers: number;
}

export interface ChartData {
  dailySignups: Array<{ date: string; signups: number }>;
  activeUsers: Array<{ date: string; active: number }>;
  documentsByType: Array<{ type: string; count: number }>;
  documentsTrend: Array<{ month: string; documents: number }>;
  userDistribution: Array<{ name: string; value: number }>;
}

export interface Activity {
  id: string;
  type: 'signup' | 'document' | 'purchase';
  user: { name: string; email: string };
  description: string;
  title?: string;
  amount?: number;
  timestamp: string;
}

export interface AdminOverviewData {
  metrics: AdminMetrics;
  charts: ChartData;
  recentActivity: Activity[];
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  documentsCreated: number;
  purchaseCount: number;
  lastActive: Date | string;
  status: 'ACTIVE' | 'INACTIVE';
  isPaid: boolean;
  onboardingComplete: boolean;
  createdAt: Date | string;
  emailVerified: Date | string | null;
}

export interface UserStats {
  totalUsers: number;
  activeThisMonth: number;
  newThisWeek: number;
  churnedThisMonth: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UsersResponse {
  users: UserListItem[];
  pagination: PaginationInfo;
  stats: UserStats;
}

export interface UserDetail {
  id: string;
  name: string | null;
  email: string | null;
  onboardingComplete: boolean;
  emailVerified: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastActive: Date | string;
  totalDocuments: number;
  totalPurchases: number;
}

export interface UserDocument {
  id: string;
  title: string;
  kind: string;
  createdAt: Date | string;
}

export interface UserPurchase {
  id: string;
  amount: number;
  type: string;
  market: string;
  currency: string;
  status: string;
  provider: string;
  description: string;
  createdAt: Date | string;
}

export interface UserDetailResponse {
  user: UserDetail;
  documents: UserDocument[];
  purchases: UserPurchase[];
}

export interface DocumentListItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  kind: string;
  createdAt: string;
}

export interface DocumentStats {
  totalDocuments: number;
  documentsToday: number;
  documentsThisWeek: number;
  avgPerUser: string;
  statsByType: {
    tailored: number;
    cover: number;
    created: number;
  };
  chartData: Array<{ date: string; tailored: number; cover: number; created: number }>;
}

export interface DocumentPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

export interface DocumentListResponse {
  documents: DocumentListItem[];
  pagination: DocumentPagination;
}

/**
 * `amountMinor` is named that ON PURPOSE. Purchase.amount is stored in minor
 * units (cents), while the old mock data used dollars — feeding a real row into
 * a component expecting `amount` renders 100x too large. The rename makes that
 * mistake a TypeScript error instead of a silent overstatement.
 */
export interface AdminPurchaseRow {
  id: string;
  userName: string;
  userEmail: string;
  amountMinor: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED' | 'BONUS';
  type: 'RESUME_DOWNLOAD_UNLOCK' | 'SYSTEM_BONUS';
  market: 'ZW' | 'ZA';
  provider: string;
  providerRef: string | null;
  documentId: string | null;
  createdAt: string;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface AdminAnalyticsData {
  growth: {
    dailySignups: Array<{ date: string; count: number }>;
    cumulativeUsers: Array<{ date: string; users: number }>;
    totalUsers: number;
  };
  engagement: {
    featureUsage: Array<{ type: string; count: number }>;
    featureUsageWindow: Array<{ type: string; count: number }>;
    docsPerUser: Array<{ range: string; count: number }>;
    timeToFirstDoc: Array<{ range: string; count: number }>;
    medianHoursToFirstDoc: number | null;
    activatedUsers: number;
  };
  activity: {
    dau: number;
    wau: number;
    mau: number;
    dailyActive: Array<{ date: string; count: number }>;
  };
  traffic: {
    viewsByDay: Array<{ date: string; count: number }>;
    uniqueByDay: Array<{ date: string; count: number }>;
    uniqueVisitors: number;
    totalViews: number;
    topPages: LabelCount[];
    referrers: LabelCount[];
    devices: LabelCount[];
    countries: LabelCount[];
  };
  meta: { windowDays: number; trackingSince: string | null; generatedAt: string };
}

export interface MoneyByCurrency {
  [currency: string]: { minor: number; count: number };
}

export interface AdminConversionData {
  funnel: Array<{ stage: string; count: number }>;
  rates: { activationRate: number; repeatUsers: number; totalUsers: number; payingCustomers: number };
  trials: {
    active: number;
    converted: number;
    rows: Array<{
      id: string;
      tier: string;
      market: string;
      name: string | null;
      email: string | null;
      trialEndsAt: string | null;
      daysRemaining: number | null;
    }>;
    byCell: Array<{ status: string; tier: string; market: string; count: number }>;
  };
  money: {
    realRevenue: MoneyByCurrency;
    pendingUnlocks: MoneyByCurrency;
    bonusGrantCount: number;
    stuckUnlocks: number;
  };
  marketSplit: Array<{ market: string; count: number }>;
  cohorts: Array<{ week: string; signups: number; activated: number; rate: number }>;
  purchases: AdminPurchaseRow[];
}

export interface AdminSystemData {
  database: { ok: boolean; latencyMs: number };
  counts: Record<string, number>;
  integrations: Array<{ key: string; group: string; configured: boolean }>;
  cron: { lastRunAt: string | null; lastStatus: string | null; daysSince: number | null };
  retention: { retentionDays: number; oldestPageViewAt: string | null; oldestAgeDays: number | null };
  errors: Array<{ id: string; source: string; message: string; context: string; at: string }>;
  errorsLast7Days: number;
}

export interface DocumentDetail {
  id: string;
  title: string;
  kind: string;
  createdAt: string;
  markdown: string;
  user: { id: string; email: string; name: string };
}
