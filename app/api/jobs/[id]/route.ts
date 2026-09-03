// app/api/jobs/[id]/route.ts
//
// One job, for a signed-in user. Exists so the tailor wizard can pre-fill the
// description instead of asking someone to paste back text we already hold —
// and so that text travels in a response body rather than a URL.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });

  try {
    const job = await prisma.jobPost.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        market: true,
        employmentType: true,
        salaryText: true,
        description: true,
        bracket: true,
        url: true,
      },
    });
    if (!job) return NextResponse.json({ ok: false, error: 'Job not found' }, { status: 404 });
    return NextResponse.json({ ok: true, job });
  } catch (error) {
    console.error('job fetch error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to load job' }, { status: 500 });
  }
}
