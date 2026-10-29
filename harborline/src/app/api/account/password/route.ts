import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { currentUserFromRequest, SESSION_COOKIE } from "@/lib/auth";
import { db, verifyPassword, log } from "@/lib/db";

// Change password: requires the current password (no email-link reset flow in
// this local build — documented as a remaining integration). On success every
// OTHER session is revoked; the caller's own session stays alive.
export async function POST(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const current = String(body.current ?? "");
  const next = String(body.next ?? "");
  if (!verifyPassword(current, user.password_hash))
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  if (next.length < 8)
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  const token = req.headers.get("cookie")?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1] ?? "";
  const d = db();
  d.transaction(() => {
    d.prepare("UPDATE users SET password_hash=? WHERE id=?").run(bcrypt.hashSync(next, 10), user.id);
    d.prepare("DELETE FROM sessions WHERE user_id=? AND token<>?").run(user.id, decodeURIComponent(token));
  });
  log(user.id, "password_change");
  return NextResponse.json({ ok: true });
}
