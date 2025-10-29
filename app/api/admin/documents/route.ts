import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { requireAdminUser } from "@/lib/admin-auth";
import { requireAdmin } from "../middleware";
import { subDays } from "date-fns";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Filters
    const kind = searchParams.get("kind") || "all";
    const search = searchParams.get("search") || "";

    // Build where
    const where: any = {};
    if (kind !== "all") {
      where.kind = {
        equals:
          kind === "tailored"
            ? "TAILORED_RESUME"
            : kind === "cover"
            ? "COVER_LETTER"
            : kind === "created"
            ? "CREATED_RESUME"
            : undefined,
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Query docs paginated
    const [docs, totalCount] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.document.count({ where }),
    ]);

    // Format
    const formatted = docs.map((doc) => ({
      id: doc.id,
      userId: doc.userId,
      userEmail: doc.user?.email ?? "",
      userName: doc.user?.name ?? "",
      title: doc.title,
      kind: doc.kind,
      createdAt: doc.createdAt,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      ok: true,
      data: {
        documents: formatted,
        pagination: { page, limit, totalPages, totalCount, hasMore: page < totalPages },
      },
    });
  } catch (e) {
    console.error("Admin documents API error", e);
    return NextResponse.json({ ok: false, error: "Failed to fetch documents" }, { status: 500 });
  }
}
