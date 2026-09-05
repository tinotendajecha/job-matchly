// app/api/public/recruiter-lead/route.ts
//
// Waitlist for the recruiter product. Unauthenticated on purpose — a recruiter
// evaluating us has no reason to create a job-seeker account first.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMarketFromRequest } from '@/lib/market/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = clean(body.name, 120);
    const email = clean(body.email, 200).toLowerCase();
    const company = clean(body.company, 160);
    const note = clean(body.note, 2000);
    const hiresPerYear = clean(body.hiresPerYear, 40);

    if (!name || !company || !email.includes('@')) {
      return NextResponse.json(
        { ok: false, error: 'Name, company and a valid email are required.' },
        { status: 400 }
      );
    }

    // Someone submitting twice is refining their answer, not creating a second
    // lead — so update rather than reject them with an error.
    await prisma.recruiterLead.upsert({
      where: { email },
      create: {
        name,
        email,
        company,
        note: note || null,
        hiresPerYear: hiresPerYear || null,
        market: getMarketFromRequest(req),
      },
      update: {
        name,
        company,
        note: note || null,
        hiresPerYear: hiresPerYear || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('recruiter lead error:', error);
    return NextResponse.json({ ok: false, error: 'Could not save that' }, { status: 500 });
  }
}
