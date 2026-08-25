import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, startOfMonth, subDays, subMonths, format } from 'date-fns';
import { requireAdmin } from '../middleware';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const now = new Date();
    const today = startOfDay(now);
    const thirtyDaysAgo = subDays(now, 30);
    const sixMonthsAgo = subMonths(now, 6);

    const yesterday = subDays(today, 1);

    const [
      totalUsers,
      activeUsers,
      newSignupsToday,
      newSignupsYesterday,
      totalDocuments,
      documentsToday,
      documentsYesterday,
      usersWithDocuments,
      inactiveUsers,
      dailySignupsRaw,
      documentsByTypeRaw,
      revenueByMonthRaw,
      sessionsForActiveTrend,
      subscribersByTierRaw,
      trialingSubscribers,
      recentActivitiesRaw,
    ] = await Promise.all([
      prisma.user.count(),

      prisma.user.count({
        where: { sessions: { some: { createdAt: { gte: thirtyDaysAgo } } } },
      }),

      prisma.user.count({ where: { createdAt: { gte: today } } }),

      prisma.user.count({ where: { createdAt: { gte: yesterday, lt: today } } }),

      prisma.document.count(),

      prisma.document.count({ where: { createdAt: { gte: today } } }),

      prisma.document.count({ where: { createdAt: { gte: yesterday, lt: today } } }),

      prisma.user.count({ where: { documents: { some: {} } } }),

      prisma.user.count({
        where: {
          OR: [
            { sessions: { none: {} } },
            { sessions: { every: { createdAt: { lt: thirtyDaysAgo } } } },
          ],
        },
      }),

      prisma.user.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),

      prisma.document.groupBy({ by: ['kind'], _count: true }),

      prisma.purchase.findMany({
        where: { status: 'PAID', createdAt: { gte: sixMonthsAgo } },
        select: { amount: true, createdAt: true },
      }),

      prisma.session.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { userId: true, createdAt: true },
      }),

      prisma.subscription.groupBy({
        by: ['tier'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),

      prisma.subscription.count({ where: { status: 'TRIALING' } }),

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
            status: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        }),
      ]),
    ]);

    const activationRate = totalUsers > 0 ? (usersWithDocuments / totalUsers) * 100 : 0;
    const churnRate = totalUsers > 0 ? (inactiveUsers / totalUsers) * 100 : 0;

    const paidUsersCount = await prisma.user.count({
      where: { purchases: { some: { status: 'PAID' } } },
    });
    const freeUsers = totalUsers - paidUsersCount;
    const avgDocsPerUser = totalUsers > 0 ? totalDocuments / totalUsers : 0;

    const dailySignupsMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      dailySignupsMap.set(format(subDays(now, i), 'MMM dd'), 0);
    }
    dailySignupsRaw.forEach((item) => {
      const date = format(new Date(item.createdAt), 'MMM dd');
      dailySignupsMap.set(date, (dailySignupsMap.get(date) || 0) + item._count);
    });
    const dailySignups = Array.from(dailySignupsMap.entries())
      .map(([date, signups]) => ({ date, signups }))
      .reverse();

    const activeUsersByDayMap = new Map<string, Set<string>>();
    for (let i = 0; i < 30; i++) {
      activeUsersByDayMap.set(format(subDays(now, i), 'MMM dd'), new Set());
    }
    sessionsForActiveTrend.forEach((session) => {
      const date = format(new Date(session.createdAt), 'MMM dd');
      activeUsersByDayMap.get(date)?.add(session.userId);
    });
    const activeUsersTrend = Array.from(activeUsersByDayMap.entries())
      .map(([date, userIds]) => ({ date, active: userIds.size }))
      .reverse();

    const tierOrder: Record<string, number> = { STARTER: 0, PRO: 1, PLUS: 2 };
    const activeSubscribersByTier = subscribersByTierRaw
      .map((item) => ({ tier: item.tier, count: item._count }))
      .sort((a, b) => (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99));

    const documentsByType = documentsByTypeRaw.map((item) => ({
      type: item.kind.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
      count: item._count,
    }));

    const revenueByMonth = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      revenueByMonth.set(format(subMonths(now, i), 'MMM yyyy'), 0);
    }
    revenueByMonthRaw.forEach((purchase) => {
      const month = format(new Date(purchase.createdAt), 'MMM yyyy');
      revenueByMonth.set(month, (revenueByMonth.get(month) || 0) + purchase.amount);
    });
    const revenueTrend = Array.from(revenueByMonth.entries())
      .map(([month, revenue]) => ({ month, revenue: revenue / 100 }))
      .reverse();

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
        description: 'made a payment',
        amount: purchase.amount / 100,
        timestamp: purchase.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json({
      ok: true,
      data: {
        metrics: {
          totalUsers,
          activeUsers,
          newSignupsToday,
          newSignupsYesterday,
          totalDocuments,
          documentsToday,
          documentsYesterday,
          activationRate,
          churnRate,
          freeUsers,
          paidUsers: paidUsersCount,
          avgDocsPerUser,
          activeSubscribersByTier,
          trialingSubscribers,
        },
        charts: {
          dailySignups,
          activeUsers: activeUsersTrend,
          documentsByType,
          revenueTrend,
          userDistribution: [
            { name: 'Free Users', value: freeUsers },
            { name: 'Paid Users', value: paidUsersCount },
          ],
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Admin overview API error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch admin overview data' }, { status: 500 });
  }
}
