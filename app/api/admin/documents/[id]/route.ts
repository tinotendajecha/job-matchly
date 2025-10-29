import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "../../middleware";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const doc = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { email: true, name: true, id: true } },
      },
    });
    if (!doc) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      data: {
        id: doc.id,
        title: doc.title,
        kind: doc.kind,
        createdAt: doc.createdAt,
        markdown: doc.markdown,
        user: doc.user,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Fetch failed" }, { status: 500 });
  }
}
