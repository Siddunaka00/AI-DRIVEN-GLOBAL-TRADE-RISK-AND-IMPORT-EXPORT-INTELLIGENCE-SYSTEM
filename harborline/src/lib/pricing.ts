// Landed-cost engine. All rates come from seeded DB tables (hs_codes, fta_rates),
// never hardcoded in the UI — one source of truth for every screen.
import { db } from "./db";

export interface CostInput {
  mode: "export" | "import";
  hsCode: string;
  quantity: number;
  unitValueInr: number;      // ex-works INR per unit (export) or CIF value basis (import)
  country: string;           // destination (export) or origin (import)
  freight: "sea" | "air";
  insurancePct?: number;     // default 0.35% of FOB
}

export interface CostLine { label: string; amount: number; note?: string; }
export interface CostResult {
  lines: CostLine[];
  subtotalAfterDuty: number;
  igst: number;
  total: number;
  perUnit: number;
  currencyNote: string;
  mfnPct: number;
  ftaPct: number | null;
  agreement: string | null;
  hsDescription: string;
}

const FREIGHT_FACTOR = { sea: 0.06, air: 0.18 }; // share of FOB, illustrative seed-level accuracy

export function lookupHs(code: string) {
  const d = db();
  let row = d.prepare("SELECT * FROM hs_codes WHERE code = ?").get(code) as any;
  if (!row) {
    // prefix match on first 6 digits so partial codes still resolve
    row = d.prepare("SELECT * FROM hs_codes WHERE code LIKE ? || '%' LIMIT 1").get(code.slice(0, 6));
  }
  return row ?? null;
}

export function findFta(country: string, hsCode: string) {
  const rows = db().prepare(
    `SELECT * FROM fta_rates WHERE country_code = ? AND (? LIKE hs_prefix || '%')
     ORDER BY LENGTH(hs_prefix) DESC LIMIT 1`
  ).all(country, hsCode) as any[];
  return rows[0] ?? null;
}

export function computeLandedCost(input: CostInput): CostResult | { error: string } {
  const hs = lookupHs(input.hsCode);
  if (!hs) return { error: `HS code ${input.hsCode} not found in the ITC-HS table.` };
  if (!(input.quantity > 0) || !(input.unitValueInr > 0)) return { error: "Quantity and unit value must be positive." };

  const qty = input.quantity, uv = input.unitValueInr;
  const exw = qty * uv;
  const inland = Math.round(exw * 0.02);            // pre-carriage, handling, port charges ~2%
  const fob = exw + inland;
  const freight = Math.round(fob * FREIGHT_FACTOR[input.freight]);
  const insurance = Math.round(fob * (input.insurancePct ?? 0.35) / 100);
  const cif = fob + freight + insurance;

  const fta = findFta(input.country, hs.code);
  const agreementActive = fta && fta.preferential_pct >= 0;
  const dutyPct = agreementActive ? fta.preferential_pct : hs.bcd_pct;

  const lines: CostLine[] = [];
  let running: number;

  if (input.mode === "export") {
    // Exporter view: cost to get goods to buyer + destination-side duty the BUYER pays (shown for negotiation).
    lines.push({ label: "Ex-works value", amount: exw, note: `${qty} × ₹${uv.toLocaleString("en-IN")}` });
    lines.push({ label: "Inland transport & handling", amount: inland, note: "≈2% of ex-works (ICD → port, CHA, handling)" });
    lines.push({ label: "FOB Mumbai", amount: fob });
    lines.push({ label: `Ocean/air freight (${input.freight})`, amount: freight, note: input.freight === "sea" ? "≈6% of FOB, seed estimate" : "≈18% of FOB, seed estimate" });
    lines.push({ label: "Marine insurance", amount: insurance, note: "0.35% of FOB" });
    lines.push({ label: "CIF destination", amount: cif });
    lines.push({ label: `Destination duty (${input.mode === "export" ? "buyer-paid" : ""} @ ${dutyPct}%)`, amount: Math.round(cif * dutyPct / 100), note: agreementActive ? `via ${fta.agreement} preferential rate` : "MFN rate applies — no FTA" });
    running = cif;
    return {
      lines, subtotalAfterDuty: running, igst: 0,
      total: running, perUnit: Math.round(running / qty),
      currencyNote: "All figures INR. Destination duty shown for negotiation context; the buyer normally pays it.",
      mfnPct: hs.bcd_pct, ftaPct: agreementActive ? fta.preferential_pct : null,
      agreement: agreementActive ? fta.agreement : null, hsDescription: hs.description,
    };
  }

  // Import into India: CIF → BCD → social welfare surcharge → IGST.
  const bcd = Math.round(cif * dutyPct / 100);
  const sws = Math.round(bcd * 0.10);              // 10% surcharge on BCD where applicable
  const assessable = cif + bcd + sws;
  const igst = Math.round(assessable * hs.gst_pct / 100);
  lines.push({ label: "Assessable (CIF) value", amount: cif });
  lines.push({ label: `Basic customs duty @ ${dutyPct}%`, amount: bcd, note: agreementActive ? `${fta.agreement} preferential (MFN would be ${hs.bcd_pct}%)` : "MFN rate — no FTA with origin" });
  lines.push({ label: "Social welfare surcharge (10% of BCD)", amount: sws });
  lines.push({ label: `IGST @ ${hs.gst_pct}% on assessable+duty`, amount: igst, note: "claimable as input credit" });
  running = assessable + igst;
  return {
    lines, subtotalAfterDuty: assessable, igst,
    total: running, perUnit: Math.round(running / qty),
    currencyNote: "All figures INR. IGST is usually recoverable as input tax credit.",
    mfnPct: hs.bcd_pct, ftaPct: agreementActive ? fta.preferential_pct : null,
    agreement: agreementActive ? fta.agreement : null, hsDescription: hs.description,
  };
}
