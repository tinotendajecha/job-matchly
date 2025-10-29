import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { requireAdminUser } from '@/lib/admin-auth';
import { requireAdmin } from '../middleware';
import { subDays, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const authResult = await requireAdmin(request);   //check later here if its makign sense

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);

    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Search param
    const search = searchParams.get('search') || '';

    // Filter params
    const status = searchParams.get('status') || 'all'; // all, active, inactive
    const accountType = searchParams.get('accountType') || 'all'; // all, free, paid

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filter (active = has recent session, inactive = no recent session)
    if (status === 'active') {
      where.sessions = {
        some: {
          createdAt: { gte: subDays(new Date(), 30) },
        },
      };
    } else if (status === 'inactive') {
      where.OR = [
        { sessions: { none: {} } },
        {
          sessions: {
            every: {
              createdAt: { lt: subDays(new Date(), 30) },
            },
          },
        },
      ];
    }

    // Account type filter
    if (accountType === 'paid') {
      where.purchases = {
        some: {
          status: 'PAID',
        },
      };
    } else if (accountType === 'free') {
      where.purchases = {
        none: {
          status: 'PAID',
        },
      };
    }

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              documents: true,
              purchases: true,
              sessions: true,
            },
          },
          sessions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
          purchases: {
            where: { status: 'PAID' },
            select: { id: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate stats for this result set
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const monthAgo = subMonths(now, 1);

    // Get stats (these are global, not filtered)
    const [totalUsers, activeThisMonth, newThisWeek, inactiveUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          sessions: {
            some: {
              createdAt: { gte: monthAgo },
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: weekAgo },
        },
      }),
      prisma.user.count({
        where: {
          OR: [
            { sessions: { none: {} } },
            {
              sessions: {
                every: {
                  createdAt: { lt: monthAgo },
                },
              },
            },
          ],
        },
      }),
    ]);

    // Format users for response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name || 'Anonymous',
      email: user.email || '',
      credits: user.credits,
      documentsCreated: user._count.documents,
      purchaseCount: user._count.purchases,
      lastActive: user.sessions[0]?.createdAt || user.createdAt,
      status: user.sessions[0] && user.sessions[0].createdAt > subDays(now, 30) ? 'ACTIVE' : 'INACTIVE',
      isPaid: user.purchases.length > 0,
      onboardingComplete: user.onboardingComplete,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      ok: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasMore: page < totalPages,
        },
        stats: {
          totalUsers,
          activeThisMonth,
          newThisWeek,
          churnedThisMonth: inactiveUsers,
        },
      },
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}
