import { buildDocxResponse, type ExportDocxBody } from "@/lib/exports/document-download";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json()) as ExportDocxBody;
  return buildDocxResponse(body);
}
