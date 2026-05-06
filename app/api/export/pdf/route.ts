import { buildPdfResponse, type ExportPdfBody } from "@/lib/exports/document-download";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as ExportPdfBody;
  return buildPdfResponse(body);
}
