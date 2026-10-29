import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { generateDocument } from "@/lib/docgen";
import { db, log } from "@/lib/db";

export async function POST(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in to generate documents." }, { status: 401 });
  try {
    const input = await req.json();
    const out = generateDocument(input);
    if ("error" in out) return NextResponse.json(out, { status: 400 });
    const info = db().prepare("INSERT INTO documents (user_id, kind, title, html, buyer_id) VALUES (?,?,?,?,?)")
      .run(user.id, input.kind, out.title, out.html, input.buyerId ?? null);
    log(user.id, "document", `${input.kind}: ${out.title}`);
    return NextResponse.json({ id: Number(info.lastInsertRowid), ...out });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Generation failed." }, { status: 500 });
  }
}
