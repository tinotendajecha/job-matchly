import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, startOfMonth, subDays, subMonths, format } from 'date-fns';

// TODO: Add admin authentication middleware here
// For now, we'll proceed without auth - ADD THIS LATER!

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const thirtyDaysAgo = subDays(now, 30);
    const thisMonth = startOfMonth(now);
    const sixMonthsAgo = subMonths(now, 6);

    // Parallel queries for performance
    const [
      totalUsers,
      activeUsers,
      newSignupsToday,
      totalDocuments,
      documentsToday,
      paidPurchases,
      allPurchases,
      usersWithDocuments,
      inactiveUsers,
      dailySignupsRaw,
      documentsByTypeRaw,
      revenueByMonthRaw,
      recentActivitiesRaw,
      userCredits,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users (had a session in last 30 days)
      prisma.user.count({
        where: {
          sessions: {
            some: {
              createdAt: { gte: thirtyDaysAgo },
            },
          },
        },
      }),

      // New signups today
      prisma.user.count({
        where: {
          createdAt: { gte: today },
        },
      }),

      // Total documents
      prisma.document.count(),

      // Documents created today
      prisma.document.count({
        where: {
          createdAt: { gte: today },
        },
      }),

      // Paid purchases for revenue calculation
      prisma.purchase.findMany({
        where: { status: 'PAID' },
        select: { amount: true, credits: true, createdAt: true },
      }),

      // All purchases for stats
      prisma.purchase.findMany({
        select: { status: true, credits: true },
      }),

      // Users with at least one document (for activation rate)
      prisma.user.count({
        where: {
          documents: {
            some: {},
          },
        },
      }),

      // Inactive users (no session in last 30 days)
      prisma.user.count({
        where: {
          OR: [
            {
              sessions: {
                none: {},
              },
            },
            {
              sessions: {
                every: {
                  createdAt: { lt: thirtyDaysAgo },
                },
              },
            },
          ],
        },
      }),

      // Daily signups for chart (last 30 days)
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: true,
      }),

      // Documents by type
      prisma.document.groupBy({
        by: ['kind'],
        _count: true,
      }),

      // Revenue by month (last 6 months)
      prisma.purchase.findMany({
        where: {
          status: 'PAID',
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          amount: true,
          createdAt: true,
        },
      }),

      // Recent activity: signups, documents, purchases
      Promise.all([
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, createdAt: true },
        }),
        prisma.document.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            kind: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        }),
        prisma.purchase.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            credits: true,
            status: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        }),
      ]),

      // User credits for average calculation
      prisma.user.aggregate({
        _sum: { credits: true },
      }),
    ]);

    // Calculate metrics
    const totalRevenue = paidPurchases.reduce((sum, p) => sum + p.amount, 0);
    const mrr = totalRevenue / 6; // Simple MRR calculation
    const totalCreditsPurchased = paidPurchases.reduce((sum, p) => sum + p.credits, 0);

    // Calculate credits used from Ledger
    const creditsUsed = await prisma.ledger.aggregate({
      where: {
        createdAt: { gte: thisMonth },
        credits: { lt: 0 }, // Negative means spent
      },
      _sum: { credits: true },
    });
    const creditsUsedThisMonth = Math.abs(creditsUsed._sum.credits || 0);

    const activationRate = totalUsers > 0 ? (usersWithDocuments / totalUsers) * 100 : 0;
    const churnRate = totalUsers > 0 ? (inactiveUsers / totalUsers) * 100 : 0;

    // Get free vs paid users
    const paidUsersCount = await prisma.user.count({
      where: {
        purchases: {
          some: {
            status: 'PAID',
          },
        },
      },
    });
    const freeUsers = totalUsers - paidUsersCount;

    const avgDocsPerUser = totalUsers > 0 ? totalDocuments / totalUsers : 0;
    const avgCreditsPerUser = totalUsers > 0 ? (userCredits._sum.credits || 0) / totalUsers : 0;

    // Process daily signups for chart
    const dailySignupsMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(now, i), 'MMM dd');
      dailySignupsMap.set(date, 0);
    }

    dailySignupsRaw.forEach((item) => {
      const date = format(new Date(item.createdAt), 'MMM dd');
      dailySignupsMap.set(date, (dailySignupsMap.get(date) || 0) + item._count);
    });

    const dailySignups = Array.from(dailySignupsMap.entries())
      .map(([date, signups]) => ({ date, signups }))
      .reverse();

    // Process active users trend (simplified - using signups as proxy)
    const activeUsersTrend = dailySignups.map((item) => ({
      date: item.date,
      active: Math.floor(item.signups * 3.5), // Rough estimation
    }));

    // Process documents by type
    const documentsByType = documentsByTypeRaw.map((item) => ({
      type: item.kind.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
      count: item._count,
    }));

    // Process revenue trend
    const revenueByMonth = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const month = format(subMonths(now, i), 'MMM yyyy');
      revenueByMonth.set(month, 0);
    }

    revenueByMonthRaw.forEach((purchase) => {
      const month = format(new Date(purchase.createdAt), 'MMM yyyy');
      revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + purchase.amount);
    });

    const revenueTrend = Array.from(revenueByMonth.entries())
      .map(([month, revenue]) => ({ month, revenue: revenue / 100 })) // Convert cents to dollars
      .reverse();

    // Process recent activities
    const [recentSignups, recentDocuments, recentPurchases] = recentActivitiesRaw;

    const recentActivity = [
      ...recentSignups.map((user) => ({
        id: user.id,
        type: 'signup' as const,
        user: { name: user.name || 'Anonymous', email: user.email || '' },
        description: 'signed up',
        timestamp: user.createdAt.toISOString(),
      })),
      ...recentDocuments.map((doc) => ({
        id: doc.id,
        type: 'document' as const,
        user: { name: doc.user.name || 'Anonymous', email: doc.user.email || '' },
        description: `created ${doc.kind.toLowerCase().replace(/_/g, ' ')}`,
        title: doc.title,
        timestamp: doc.createdAt.toISOString(),
      })),
      ...recentPurchases.map((purchase) => ({
        id: purchase.id,
        type: 'purchase' as const,
        user: { name: purchase.user.name || 'Anonymous', email: purchase.user.email || '' },
        description: `purchased ${purchase.credits} credits`,
        amount: purchase.amount / 100, // Convert cents to dollars
        timestamp: purchase.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // User distribution for pie chart
    const userDistribution = [
      { name: 'Free Users', value: freeUsers },
      { name: 'Paid Users', value: paidUsersCount },
    ];

    // Return all data
    return NextResponse.json({
      ok: true,
      data: {
        metrics: {
          totalUsers,
          activeUsers,
          newSignupsToday,
          totalDocuments,
          documentsToday,
          mrr: mrr / 100, // Convert to dollars
          totalRevenue: totalRevenue / 100,
          totalCreditsPurchased,
          creditsUsedThisMonth,
          activationRate,
          churnRate,
          freeUsers,
          paidUsers: paidUsersCount,
          avgDocsPerUser,
          avgCreditsPerUser,
        },
        charts: {
          dailySignups,
          activeUsers: activeUsersTrend,
          documentsByType,
          revenueTrend,
          userDistribution,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Admin overview API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch admin overview data',
      },
      { status: 500 }
    );
  }
}
