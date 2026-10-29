import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/hs/search?q=cumin  → name or code search over the ITC-HS seed table.
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ results: [] });
  const like = `%${q}%`;
  const rows = db().prepare(`SELECT * FROM hs_codes WHERE code LIKE ? || '%' OR description LIKE ? ORDER BY code LIMIT 20`).all(q.replace(/[^0-9]/g, "") || q, like);
  return NextResponse.json({ results: rows });
}
