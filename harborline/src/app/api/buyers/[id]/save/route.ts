import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { db, log } from "@/lib/db";

// POST toggles save; also accepts action=outreach to add to the outreach list.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const id = Number(params.id);
  const d = db();
  if (!d.prepare("SELECT 1 FROM buyers WHERE id=?").get(id)) return NextResponse.json({ error: "Buyer not found." }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "outreach") {
    d.prepare("INSERT OR IGNORE INTO outreach_list (user_id, buyer_id) VALUES (?,?)").run(user.id, id);
    log(user.id, "outreach_add", `buyer ${id}`);
    return NextResponse.json({ ok: true, inOutreach: true });
  }
  const saved = d.prepare("SELECT 1 FROM saved_buyers WHERE user_id=? AND buyer_id=?").get(user.id, id);
  if (saved) { d.prepare("DELETE FROM saved_buyers WHERE user_id=? AND buyer_id=?").run(user.id, id); log(user.id, "unsaved", `buyer ${id}`); }
  else { d.prepare("INSERT INTO saved_buyers (user_id, buyer_id) VALUES (?,?)").run(user.id, id); log(user.id, "saved", `buyer ${id}`); }
  return NextResponse.json({ ok: true, saved: !saved });
}
