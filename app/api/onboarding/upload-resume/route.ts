// app/api/onboarding/upload-resume/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    if (!user.emailVerified) return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
    if (file.size > 5_000_000) return NextResponse.json({ ok: false, error: "File too large (5MB max)" }, { status: 400 });

    const ext = path.extname(file.name).toLowerCase();
    let text = "";

    if (ext === ".docx") {
      const mammoth = await import("mammoth");
      const buf = Buffer.from(await file.arrayBuffer());
      const { value } = await mammoth.extractRawText({ buffer: buf });
      text = (value || "").trim();
    } else if (ext === ".txt") {
      text = (await file.text()).toString().trim();
    } else {
      return NextResponse.json({ ok: false, error: "Unsupported file. Use .docx or .txt" }, { status: 415 });
    }

    if (!text) return NextResponse.json({ ok: false, error: "No extractable text" }, { status: 422 });

    const markdown = text; // keep raw as markdown for MVP
    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        kind: "CREATED_RESUME", // we treat imported as a base resume asset
        title: file.name ?? "Imported Resume",
        markdown,
        sections: {}, // optional for later editor parsing
        sourceMeta: { source: "ONBOARDING_UPLOAD", filename: file.name, ext },
      },
    });

    return NextResponse.json({ ok: true, documentId: doc.id, markdown });
  } catch (err: any) {
    console.error("onboarding upload fatal:", err?.message || err);
    return NextResponse.json({ ok: false, error: "Server error while uploading" }, { status: 500 });
  }
}
