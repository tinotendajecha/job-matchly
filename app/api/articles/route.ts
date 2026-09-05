// app/api/articles/route.ts
//
// The career briefing, paginated. Until now these only appeared as five items
// on the dashboard, so most of what the pipeline collects was never reachable.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  try {
    const params = request.nextUrl.searchParams;
    const page = Math.max(Number(params.get('page')) || 1, 1);
    const category = (params.get('category') || '').trim();

    const where = {
      status: 'PUBLISHED' as const,
      ...(category && category !== 'all' ? { category } : {}),
    };

    const [total, items, categoriesRaw] = await Promise.all([
      prisma.briefingItem.count({ where }),
      prisma.briefingItem.findMany({
        where,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          summary: true,
          category: true,
          source: true,
          sourceDetail: true,
          image: true,
          readTime: true,
          url: true,
          featured: true,
          createdAt: true,
        },
      }),
      // Only categories that actually have something in them, so the filter
      // never offers a tab that leads nowhere.
      prisma.briefingItem.groupBy({
        by: ['category'],
        where: { status: 'PUBLISHED' },
        _count: true,
        orderBy: { _count: { category: 'desc' } },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      items: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
      categories: categoriesRaw.map((c) => ({ name: c.category, count: c._count })),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      },
    });
  } catch (error) {
    console.error('articles error:', error);
    return NextResponse.json({ ok: false, error: 'Could not load articles' }, { status: 500 });
  }
}
