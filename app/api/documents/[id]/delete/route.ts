import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

    const doc = await prisma.document.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!doc) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true, message: 'Document deleted' });
  } catch (err) {
    console.error('document delete error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
