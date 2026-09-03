// app/api/public/job/[id]/route.ts
//
// Minimal public job data for the share-preview card.
//
// Exists because the preview image runs on the edge runtime — the only build of
// @vercel/og that works reliably here — and edge can't reach Prisma. Every field
// below is already visible on the public job page, so this exposes nothing new.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const job = await prisma.jobPost.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        company: true,
        location: true,
        market: true,
        salaryText: true,
        bracket: true,
        employmentType: true,
      },
    });
    if (!job) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: true, job });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
