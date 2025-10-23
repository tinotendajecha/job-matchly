export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type DocumentKind = 'TAILORED_RESUME' | 'CREATED_RESUME' | 'COVER_LETTER';
export type PurchaseStatus = 'PENDING' | 'PAID' | 'FAILED';
export type LedgerType = 'PURCHASE' | 'SPEND';

export interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  onboardingComplete: boolean;
  createdAt: Date;
  lastActive: Date;
  status: UserStatus;
  isPaid: boolean;
  documentsCreated: number;
}

export interface Document {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  kind: DocumentKind;
  title: string;
  createdAt: Date;
  status: 'completed' | 'failed';
}

export interface Purchase {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  credits: number;
  status: PurchaseStatus;
  provider: string;
  createdAt: Date;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  type: LedgerType;
  credits: number;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  eventType: 'signup' | 'document_created' | 'purchase' | 'login';
  userId: string;
  userName: string;
  userEmail: string;
  details: string;
}

const generateMockUsers = (count: number): User[] => {
  const users: User[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const createdDaysAgo = Math.floor(Math.random() * 90);
    const lastActiveDaysAgo = Math.floor(Math.random() * createdDaysAgo);
    const isPaid = Math.random() > 0.7;

    users.push({
      id: `user-${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      credits: isPaid ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 5),
      onboardingComplete: Math.random() > 0.2,
      createdAt: new Date(now.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000),
      lastActive: new Date(now.getTime() - lastActiveDaysAgo * 24 * 60 * 60 * 1000),
      status: lastActiveDaysAgo < 30 ? 'ACTIVE' : 'INACTIVE',
      isPaid,
      documentsCreated: Math.floor(Math.random() * 15),
    });
  }

  return users;
};

const generateMockDocuments = (users: User[]): Document[] => {
  const documents: Document[] = [];
  const kinds: DocumentKind[] = ['TAILORED_RESUME', 'COVER_LETTER'];
  const now = new Date();

  users.forEach((user) => {
    const docCount = user.documentsCreated;
    for (let i = 0; i < docCount; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      documents.push({
        id: `doc-${user.id}-${i + 1}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        kind: kinds[Math.floor(Math.random() * kinds.length)],
        title: `${kinds[Math.floor(Math.random() * kinds.length)].replace(/_/g, ' ')} ${i + 1}`,
        createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
        status: Math.random() > 0.05 ? 'completed' : 'failed',
      });
    }
  });

  return documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

const generateMockPurchases = (users: User[]): Purchase[] => {
  const purchases: Purchase[] = [];
  const now = new Date();

  users.filter(u => u.isPaid).forEach((user, index) => {
    const purchaseCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < purchaseCount; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const amount = [5, 10, 20, 50][Math.floor(Math.random() * 4)];
      const credits = amount * 10;

      purchases.push({
        id: `purchase-${index}-${i + 1}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        amount,
        credits,
        status: Math.random() > 0.1 ? 'PAID' : Math.random() > 0.5 ? 'PENDING' : 'FAILED',
        provider: 'Pesepay',
        createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      });
    }
  });

  return purchases.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

const generateActivityLogs = (users: User[], documents: Document[], purchases: Purchase[]): ActivityLog[] => {
  const logs: ActivityLog[] = [];

  users.forEach((user) => {
    logs.push({
      id: `log-signup-${user.id}`,
      timestamp: user.createdAt,
      eventType: 'signup',
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      details: 'User signed up',
    });
  });

  documents.slice(0, 50).forEach((doc) => {
    logs.push({
      id: `log-doc-${doc.id}`,
      timestamp: doc.createdAt,
      eventType: 'document_created',
      userId: doc.userId,
      userName: doc.userName,
      userEmail: doc.userEmail,
      details: `Created ${doc.kind.replace(/_/g, ' ').toLowerCase()}`,
    });
  });

  purchases.slice(0, 30).forEach((purchase) => {
    logs.push({
      id: `log-purchase-${purchase.id}`,
      timestamp: purchase.createdAt,
      eventType: 'purchase',
      userId: purchase.userId,
      userName: purchase.userName,
      userEmail: purchase.userEmail,
      details: `Purchased ${purchase.credits} credits for $${purchase.amount}`,
    });
  });

  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const mockUsers = generateMockUsers(150);
export const mockDocuments = generateMockDocuments(mockUsers);
export const mockPurchases = generateMockPurchases(mockUsers);
export const mockActivityLogs = generateActivityLogs(mockUsers, mockDocuments, mockPurchases);

export const getChartData = () => {
  const now = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    return date;
  });

  return {
    dailySignups: last30Days.map((date) => {
      const count = mockUsers.filter((u) => {
        const userDate = new Date(u.createdAt);
        return userDate.toDateString() === date.toDateString();
      }).length;

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        signups: count + Math.floor(Math.random() * 3),
      };
    }),

    activeUsers: last30Days.map((date) => {
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        active: Math.floor(Math.random() * 50) + 30,
      };
    }),

    documentsByType: [
      { type: 'Tailored Resume', count: mockDocuments.filter(d => d.kind === 'TAILORED_RESUME').length },
      { type: 'Cover Letter', count: mockDocuments.filter(d => d.kind === 'COVER_LETTER').length },
      { type: 'Created Resume', count: 0 },
    ],

    revenueTrend: Array.from({ length: 6 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const revenue = mockPurchases
        .filter((p) => {
          const pDate = new Date(p.createdAt);
          return pDate.getMonth() === month.getMonth() &&
                 pDate.getFullYear() === month.getFullYear() &&
                 p.status === 'PAID';
        })
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        revenue: revenue + Math.floor(Math.random() * 500) + 1000,
      };
    }),
  };
};
