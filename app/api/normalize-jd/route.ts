import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";


export async function POST(req: Request) {
    const type = req.headers.get("content-type") || "";


    // file upload
    if (type.includes("multipart/form-data")) {
        const form = await req.formData();
        const file = form.get("file") as File | null;
        if (!file) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
        const text = (await file.text()).toString();
        return NextResponse.json({ ok: true, jdText: text });
    }


    // JSON body
    const body = await req.json().catch(() => ({} as any));
    if (body.text) return NextResponse.json({ ok: true, jdText: body.text });


    if (body.url) {
        const html = await fetch(body.url).then((r) => r.text());
        const dom = new JSDOM(html);
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        const text = (article?.textContent || "").trim();
        return NextResponse.json({ ok: true, jdText: text });
    }


    return NextResponse.json({ ok: false, error: "No input" }, { status: 400 });
}