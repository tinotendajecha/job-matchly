export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  newSignupsToday: number;
  totalDocuments: number;
  documentsToday: number;
  mrr: number;
  totalRevenue: number;
  totalCreditsPurchased: number;
  creditsUsedThisMonth: number;
  activationRate: number;
  churnRate: number;
  freeUsers: number;
  paidUsers: number;
  avgDocsPerUser: number;
  avgCreditsPerUser: number;
}

export interface ChartData {
  dailySignups: Array<{ date: string; signups: number }>;
  activeUsers: Array<{ date: string; active: number }>;
  documentsByType: Array<{ type: string; count: number }>;
  revenueTrend: Array<{ month: string; revenue: number }>;
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

// ... existing types ...

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  credits: number;
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
  credits: number;
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
  credits: number;
  status: string;
  provider: string;
  createdAt: Date | string;
}

export interface CreditHistoryItem {
  id: string;
  type: string;
  credits: number;
  createdAt: Date | string;
}

export interface UserDetailResponse {
  user: UserDetail;
  documents: UserDocument[];
  purchases: UserPurchase[];
  creditHistory: CreditHistoryItem[];
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

export interface DocumentDetail {
  id: string;
  title: string;
  kind: string;
  createdAt: string;
  markdown: string;
  user: { id: string; email: string; name: string };
}
