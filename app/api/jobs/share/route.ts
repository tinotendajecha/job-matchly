// app/api/jobs/share/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { trackShareEvent } from '@/lib/jobs/share';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Records that someone shared a job. Open to signed-out visitors on purpose —
 * a visitor passing a link on is exactly the behaviour we want to measure.
 */
export async function POST(req: Request) {
  try {
    const { jobId } = await req.json();
    if (typeof jobId !== 'string' || !jobId) {
      return NextResponse.json({ ok: false, error: 'jobId required' }, { status: 400 });
    }
    const user = await getCurrentUser();
    await trackShareEvent(jobId, 'SHARED', {
      userId: user?.id,
      visitorId: cookies().get('jm_vid')?.value ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
