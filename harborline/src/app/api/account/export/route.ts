import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";
import { db, log } from "@/lib/db";

// Data portability: one JSON download of everything the account holds.
export async function GET(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  const d = db();
  const q = (sql: string) => d.prepare(sql).all(user.id);
  const bundle = {
    exportedAt: new Date().toISOString(),
    account: { email: user.email, fullName: user.full_name, company: user.company, plan: user.plan, credits: user.credits, createdAt: user.created_at },
    unlocks: q("SELECT u.buyer_id, b.company_name, u.unlocked_at FROM unlocks u JOIN buyers b ON b.id=u.buyer_id WHERE u.user_id=?"),
    savedBuyers: q("SELECT s.buyer_id, b.company_name, s.saved_at FROM saved_buyers s JOIN buyers b ON b.id=s.buyer_id WHERE s.user_id=?"),
    outreach: q("SELECT o.buyer_id, b.company_name, o.status, o.added_at FROM outreach_list o JOIN buyers b ON b.id=o.buyer_id WHERE o.user_id=?"),
    scenarios: q("SELECT id, name, payload, created_at FROM scenarios WHERE user_id=?"),
    documents: q("SELECT id, kind, title, buyer_id, created_at FROM documents WHERE user_id=?"),
    auditLog: q("SELECT action, detail, created_at FROM audit_log WHERE user_id=? ORDER BY id DESC"),
  };
  log(user.id, "data_export");
  return new Response(JSON.stringify(bundle, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="harborline-data-${user.id}.json"` },
  });
}
