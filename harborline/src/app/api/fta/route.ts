import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lookupHs, findFta } from "@/lib/pricing";

// GET /api/fta?country=AE&hs=090921 — agreement, rates, COO steps, RoO warning.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const country = (u.searchParams.get("country") ?? "").toUpperCase();
  const hsCode = (u.searchParams.get("hs") ?? "").replace(/\D/g, "");
  if (!country || !hsCode) return NextResponse.json({ error: "Provide a destination country and an HS code." }, { status: 400 });
  const hs = lookupHs(hsCode);
  if (!hs) return NextResponse.json({ error: `HS ${hsCode} not in the seeded table.` }, { status: 404 });
  const c = db().prepare("SELECT * FROM countries WHERE code=?").get(country) as any;
  if (!c) return NextResponse.json({ error: "Unknown country." }, { status: 404 });
  const fta = findFta(country, hs.code);
  const sensitive = hs.bcd_pct >= 60; // high-MFN lines get an extra rules-of-origin caution
  if (!fta) {
    return NextResponse.json({
      country: c.name, hs, agreement: null,
      message: `No India trade agreement on file gives a preferential rate for ${hs.description} into ${c.name}. Your buyer pays the MFN rate shown by their customs authority.`,
      cooSteps: ["No FTA certificate needed — commercial invoice + packing list only.", "If goods transit a free zone, keep the original origin evidence anyway."],
      rooWarning: null,
    });
  }
  const excluded = fta.preferential_pct < 0;
  return NextResponse.json({
    country: c.name, hs,
    agreement: {
      name: fta.agreement, inForceSince: fta.in_force_since, mfnPct: hs.bcd_pct,
      preferentialPct: fta.preferential_pct, excluded, savingPct: excluded ? 0 : +(hs.bcd_pct - fta.preferential_pct).toFixed(2),
      rooNote: fta.roo_note,
    },
    cooSteps: [
      `Register the shipment category once with DGFT/authorised issuing body (IEC required).`,
      `Apply for ${fta.coo_form} per consignment via ICEGATE/DGFT portal with the shipping-bill draft.`,
      `Attach commercial invoice, packing list and (if asked) manufacturer declaration of origin.`,
      `Certificate is validated digitally at the destination port; keep the PDF for 5 years.`,
    ],
    rooWarning: sensitive
      ? `Heads up: this is a sensitive/high-duty line (${hs.bcd_pct}% MFN reference). Preferential treatment usually needs proof that processing happened in India — sorting alone may not satisfy "${fta.roo_note.split(";")[0]}". Ask your CHA before quoting zero duty.`
      : null,
  });
}
