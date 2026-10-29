import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

// Saved buyers + outreach list with buyer summaries (contacts stay masked
// unless individually unlocked).
export async function GET(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  const d = db();
  const saved = d.prepare(`
    SELECT s.buyer_id AS id, s.saved_at, b.company_name, b.city, b.country_code, c.flag, c.name AS country,
      b.company_type, b.verification, b.verified_on,
      (SELECT group_concat(product_name, ' · ') FROM buyer_products p WHERE p.buyer_id=b.id) AS products,
      (SELECT 1 FROM unlocks u WHERE u.user_id=s.user_id AND u.buyer_id=s.buyer_id) AS unlocked
    FROM saved_buyers s JOIN buyers b ON b.id=s.buyer_id JOIN countries c ON c.code=b.country_code
    WHERE s.user_id=? ORDER BY s.saved_at DESC`).all(user.id);
  const outreach = d.prepare(`
    SELECT o.buyer_id AS id, o.status, o.added_at, b.company_name, b.city, c.flag, c.name AS country
    FROM outreach_list o JOIN buyers b ON b.id=o.buyer_id JOIN countries c ON c.code=b.country_code
    WHERE o.user_id=? ORDER BY o.added_at DESC`).all(user.id);
  return NextResponse.json({ saved, outreach });
}
