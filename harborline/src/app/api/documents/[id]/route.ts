import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

// Full document HTML for on-screen preview + print-to-PDF.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  const row = db().prepare("SELECT id, kind, title, html, created_at FROM documents WHERE id=? AND user_id=?")
    .get(Number(params.id), user.id) as any;
  if (!row) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  return NextResponse.json(row);
}
