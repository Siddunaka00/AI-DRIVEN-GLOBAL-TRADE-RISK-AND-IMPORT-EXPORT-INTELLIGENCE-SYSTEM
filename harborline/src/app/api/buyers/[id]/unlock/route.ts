import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { db, log } from "@/lib/db";

// Free contact unlock with persisted audit record. Survives refresh.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in to unlock contacts." }, { status: 401 });
  const id = Number(params.id);
  const d = db();
  const buyer = d.prepare("SELECT id, company_name FROM buyers WHERE id=?").get(id) as any;
  if (!buyer) return NextResponse.json({ error: "Buyer not found." }, { status: 404 });
  // Academic build: contact unlocks are FREE. The unlock row is still recorded
  // for activity history/auditing; duplicate requests never insert twice.
  const existing = d.prepare("SELECT 1 FROM unlocks WHERE user_id=? AND buyer_id=?").get(user.id, id);
  if (!existing) d.prepare("INSERT INTO unlocks (user_id, buyer_id) VALUES (?,?)").run(user.id, id);
  if (existing) return NextResponse.json({ ok: true, alreadyUnlocked: true });
  log(user.id, "unlock", `buyer ${id}: ${buyer.company_name}`);
  return NextResponse.json({ ok: true });
}
