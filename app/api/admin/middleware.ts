import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function requireAdmin(request: NextRequest) {
  try {
    // Get session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value; // Adjust cookie name to match your auth

    // console.log('Session Token:', sessionToken);

    if (!sessionToken) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - No session' },
        { status: 401 }
      );
    }

    // Find session and user
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Invalid or expired session' },
        { status: 401 }
      );
    }

    if (!session.user.isAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Return the user for use in the route
    return session.user;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
