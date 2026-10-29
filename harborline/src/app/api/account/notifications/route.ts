import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/account/notifications — the user's own audit trail, newest first.
// Deliberately real records only: no invented alerts.
export async function GET(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  const items = db().prepare(
    "SELECT id, action, detail, created_at FROM audit_log WHERE user_id=? ORDER BY id DESC LIMIT 20"
  ).all(user.id);
  return NextResponse.json({ items });
}
