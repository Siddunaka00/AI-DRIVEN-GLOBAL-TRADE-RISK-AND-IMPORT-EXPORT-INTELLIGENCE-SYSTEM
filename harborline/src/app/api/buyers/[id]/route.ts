import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { buyerDetail } from "@/lib/match";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = currentUserFromRequest(req);
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Bad buyer id." }, { status: 400 });
  const unlocked = !!user && !!(db().prepare("SELECT 1 FROM unlocks WHERE user_id=? AND buyer_id=?").get(user.id, id));
  const detail = buyerDetail(id, unlocked);
  if (!detail) return NextResponse.json({ error: "Buyer not found." }, { status: 404 });
  return NextResponse.json({ ...detail, unlocked: !!unlocked, credits: user?.credits ?? null });
}
