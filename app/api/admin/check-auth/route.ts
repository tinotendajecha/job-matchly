import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../middleware';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  return NextResponse.json({
    ok: true,
    isAdmin: true,
    user: {
      id: authResult.id,
      name: authResult.name,
      email: authResult.email,
    },
  });
}
