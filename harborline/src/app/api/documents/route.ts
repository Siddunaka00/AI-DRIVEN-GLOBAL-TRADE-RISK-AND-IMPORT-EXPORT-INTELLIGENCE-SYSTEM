import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

// User's generated documents (list without html to keep payloads small).
export async function GET(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  const rows = db().prepare(
    `SELECT d.id, d.kind, d.title, d.buyer_id, d.created_at, b.company_name AS buyer
     FROM documents d LEFT JOIN buyers b ON b.id=d.buyer_id
     WHERE d.user_id=? ORDER BY d.id DESC`).all(user.id);
  return NextResponse.json({ documents: rows });
}
