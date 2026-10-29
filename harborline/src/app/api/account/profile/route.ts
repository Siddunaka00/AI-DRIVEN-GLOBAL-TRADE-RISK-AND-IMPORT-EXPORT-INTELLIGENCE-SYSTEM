import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { db, log } from "@/lib/db";

// Profile edit: users may only change their own name/company. Email is the
// identity key and stays read-only in this build (no email-change flow).
export async function PATCH(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const fullName = String(body.fullName ?? "").trim();
  const company = String(body.company ?? "").trim();
  if (!fullName || fullName.length < 2)
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  db().prepare("UPDATE users SET full_name=?, company=? WHERE id=?").run(fullName, company || null, user.id);
  log(user.id, "profile_update", fullName);
  return NextResponse.json({ ok: true, fullName, company: company || null });
}
