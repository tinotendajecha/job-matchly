import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildDocxResponse, buildPdfResponse } from "@/lib/exports/document-download";
import { requireSubscription, requireFeatureAccess, requireAndConsumeUsage, SubscriptionGateError } from "@/lib/subscription/gates";

export const runtime = "nodejs";

type Body = {
  format: "pdf" | "docx";
  templateId?: string;
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const { format, templateId } = (await req.json()) as Body;
  if (format !== "pdf" && format !== "docx") {
    return NextResponse.json({ ok: false, error: "Unsupported format" }, { status: 400 });
  }

  // Subscription gate
  try {
    await requireSubscription(user.id);
    if (format === "docx") await requireFeatureAccess(user.id, "docx");
    await requireAndConsumeUsage(user.id, "download");
  } catch (err) {
    if (err instanceof SubscriptionGateError) return err.toResponse();
    throw err;
  }

  const document = await prisma.document.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true, title: true, markdown: true },
  });

  if (!document) {
    return NextResponse.json({ ok: false, error: "Document not found" }, { status: 404 });
  }

  if (format === "pdf") {
    return buildPdfResponse({
      markdown: document.markdown,
      filename: document.title || "resume",
      templateId: (templateId as any) || "classic",
    });
  }

  return buildDocxResponse({
    markdown: document.markdown,
    filename: document.title || "resume",
    templateId,
  });
}
