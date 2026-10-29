import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { db, log } from "@/lib/db";

// Save a landed-cost scenario (survives refresh). GET lists the user's scenarios.
export async function POST(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in to save scenarios." }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.name || !body.payload) return NextResponse.json({ error: "Scenario needs a name and payload." }, { status: 400 });
    const info = db().prepare("INSERT INTO scenarios (user_id, name, payload) VALUES (?,?,?)")
      .run(user.id, String(body.name).slice(0, 80), JSON.stringify(body.payload));
    log(user.id, "scenario_save", String(body.name));
    return NextResponse.json({ ok: true, id: Number(info.lastInsertRowid) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Save failed." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  const rows = db().prepare("SELECT id, name, created_at, payload FROM scenarios WHERE user_id=? ORDER BY id DESC").all(user.id) as any[];
  return NextResponse.json({ scenarios: rows.map(r => ({ ...r, payload: JSON.parse(r.payload) })) });
}
