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
