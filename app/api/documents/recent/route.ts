// app/api/documents/recent/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || '8'), 50);

    const docs = await prisma.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, title: true, kind: true, createdAt: true },
    });

    // Normalize dates to ISO strings
    const documents = docs.map(d => ({ ...d, createdAt: d.createdAt.toISOString() }));

    return NextResponse.json({ ok: true, documents });
  } catch (err: any) {
    console.error('documents/recent error', err);
    console.log(err)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
