import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lookupHs } from "@/lib/pricing";

// GET /api/incentives?hs=610910 — RoDTEP / drawback / RoSCTL for an export code.
export async function GET(req: Request) {
  const hsCode = (new URL(req.url).searchParams.get("hs") ?? "").replace(/\D/g, "");
  if (!hsCode) return NextResponse.json({ error: "Provide an HS code." }, { status: 400 });
  const hs = lookupHs(hsCode);
  if (!hs) return NextResponse.json({ error: `HS ${hsCode} not in the seeded table.` }, { status: 404 });
  const d = db();
  const rows = d.prepare(`SELECT * FROM incentives WHERE (? LIKE hs_prefix || '%') ORDER BY LENGTH(hs_prefix) DESC`).all(hs.code) as any[];
  const best: Record<string, any> = {};
  for (const r of rows) if (!best[r.scheme]) best[r.scheme] = r; // longest prefix wins
  const schemes = Object.values(best).map(r => ({ scheme: r.scheme, ratePct: r.rate_pct, mode: r.mode, steps: JSON.parse(r.steps) }));
  const apparel = hs.code.startsWith("61") || hs.code.startsWith("62");
  return NextResponse.json({
    hs, schemes,
    note: "Rates are clearly-labeled illustrative sample values seeded for this demo world. Live rates change with each DGFT/Board notification — verify against the official notification before claiming.",
    apparelNote: apparel ? null : "RoSCTL applies to knitted/woven apparel (Ch. 61–62) only; it is correctly absent for this code.",
  });
}
