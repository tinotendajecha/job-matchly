import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const kindParam = (searchParams.get('kind') || 'all').toLowerCase();
    const search = (searchParams.get('search') || '').trim();

    const where: any = { userId: user.id };
    if (kindParam !== 'all') {
      where.kind =
        kindParam === 'tailored'
          ? 'TAILORED_RESUME'
          : kindParam === 'cover'
          ? 'COVER_LETTER'
          : kindParam === 'created'
          ? 'CREATED_RESUME'
          : undefined;
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [totalCount, docs] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: { id: true, title: true, kind: true, createdAt: true },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const documents = docs.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() }));

    return NextResponse.json({
      ok: true,
      documents,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    console.error('documents list error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
