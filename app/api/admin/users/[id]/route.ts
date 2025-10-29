import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '../../middleware';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            kind: true,
            createdAt: true,
          },
        },
        purchases: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            credits: true,
            status: true,
            provider: true,
            createdAt: true,
          },
        },
        Ledger: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            credits: true,
            createdAt: true,
          },
        },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
        _count: {
          select: {
            documents: true,
            purchases: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          credits: user.credits,
          onboardingComplete: user.onboardingComplete,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastActive: user.sessions[0]?.createdAt || user.createdAt,
          totalDocuments: user._count.documents,
          totalPurchases: user._count.purchases,
        },
        documents: user.documents,
        purchases: user.purchases.map((p) => ({
          ...p,
          amount: p.amount / 100, // Convert cents to dollars
        })),
        creditHistory: user.Ledger,
      },
    });
  } catch (error) {
    console.error('Admin user detail API error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch user details',
      },
      { status: 500 }
    );
  }
}
