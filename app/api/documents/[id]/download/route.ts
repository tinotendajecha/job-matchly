import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDocumentDownloadState } from "@/lib/documents/access";
import { buildDocxResponse, buildPdfResponse } from "@/lib/exports/document-download";

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

  const document = await prisma.document.findFirst({
    where: { id: params.id, userId: user.id },
    select: {
      id: true,
      title: true,
      kind: true,
      markdown: true,
      market: true,
      downloadPriceMinor: true,
      downloadCurrency: true,
      unlockedAt: true,
    },
  });

  if (!document) {
    return NextResponse.json({ ok: false, error: "Document not found" }, { status: 404 });
  }

  const downloadState = getDocumentDownloadState(document);
  if (!downloadState.canDownload) {
    return NextResponse.json(
      {
        ok: false,
        error: "Payment required before download",
        code: "PAYMENT_REQUIRED",
        downloadState,
      },
      { status: 402 }
    );
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
