import { NextResponse } from "next/server";
import { currentUserFromRequest, SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";

// Right to erasure: cascade delete of the user row removes unlocks, saves,
// outreach, scenarios, documents, sessions (FK ON DELETE CASCADE). Audit rows
// referencing the user are cleared too.
export async function POST(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.confirm !== user.email) return NextResponse.json({ error: "Type your email exactly to confirm deletion." }, { status: 400 });
  const d = db();
  d.transaction(() => {
    d.prepare("DELETE FROM audit_log WHERE user_id=?").run(user.id);
    d.prepare("DELETE FROM users WHERE id=?").run(user.id);
  });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
