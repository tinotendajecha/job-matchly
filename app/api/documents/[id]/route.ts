import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const doc = await prisma.document.findFirst({
      where: { id: params.id, userId: user.id },
      select: {
        id: true,
        title: true,
        kind: true,
        markdown: true,
        createdAt: true,
        updatedAt: true,
        sourceMeta: true,
      },
    });

    if (!doc) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      ok: true,
      document: {
        ...doc,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('documents detail error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
