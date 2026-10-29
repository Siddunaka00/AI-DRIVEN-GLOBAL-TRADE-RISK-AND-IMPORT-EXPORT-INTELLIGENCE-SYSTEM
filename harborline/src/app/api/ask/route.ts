import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searchBuyers } from "@/lib/match";
import { computeLandedCost, lookupHs } from "@/lib/pricing";

// Ask TradeIQ — a deterministic intent router over TradeIQ's own APIs.
// It calls the same functions the tools use and returns a structured brief:
// answer + the exact records/numbers used + why. No invented text, no streaming theatre.

// Module-scope response helper (kept outside the handler so strict-mode TS is
// happy and every brief shares one envelope shape).
function brief(o: { answer?: string; data?: Record<string, unknown>; sources?: string[]; why?: string; error?: string }) {
  return NextResponse.json({ ok: true, ...o, generatedAt: new Date().toISOString() });
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const p = String(prompt ?? "").toLowerCase().trim();
    if (!p) return NextResponse.json({ error: "Type a question first." }, { status: 400 });

    const countries = db().prepare("SELECT * FROM countries").all() as any[];
    const hsRows = db().prepare("SELECT * FROM hs_codes").all() as any[];

    // resolve a country mention ("in the UK", "to UAE", "cotton t-shirts USA")
    let cc: string | null = null;
    for (const c of countries) {
      if (new RegExp(`\\b(${c.code.toLowerCase()}|${c.name.toLowerCase()})\\b`).test(p)) { cc = c.code; break; }
    }
    // resolve an HS code or product word
    let hs = null as any;
    const codeMatch = p.match(/\b(\d{4,8})\b/);
    if (codeMatch) hs = lookupHs(codeMatch[1]);
    if (!hs) {
      for (const h of hsRows) {
        const word = h.description.split(",")[0].split(" ")[0].toLowerCase();
        if (p.includes(word) || p.includes(h.description.split(",")[0].toLowerCase())) { hs = h; break; }
      }
    }

    // ---- intent: incentives ("do I get rodtep / incentive / drawback")
    if (/rodtep|rosctl|drawback|incentive/.test(p)) {
      if (!hs) return brief({ answer: "I can check incentives for a specific product. Name the product (e.g. “RoDTEP on cotton T-shirts”) or paste an 8-digit HS code.", sources: ["hs_codes table"] });
      const rows = db().prepare(`SELECT * FROM incentives WHERE (? LIKE hs_prefix || '%') ORDER BY LENGTH(hs_prefix) DESC`).all(hs.code) as any[];
      const best: Record<string, any> = {};
      for (const r of rows) if (!best[r.scheme]) best[r.scheme] = r;
      const schemes = Object.values(best).map(r => ({ scheme: r.scheme, ratePct: r.rate_pct, mode: r.mode, steps: JSON.parse(r.steps) }));
      if (!schemes.length) return brief({ answer: `No seeded incentive applies to ${hs.description} (${hs.code}).`, sources: ["incentives table"] });
      const main = schemes.find(s => s.scheme.startsWith("RoDTEP")) ?? schemes[0];
      return brief({
        answer: `Yes — for ${hs.description} (${hs.code}) the sample world shows ${schemes.map(s => `${s.scheme}: ${s.ratePct}% (${s.mode})`).join(" · ")}. Typical claim path: ${main.steps.join(" → ")}. Rates are illustrative seed values, not live notifications.`,
        data: { hs, schemes },
        sources: [`hs_codes:${hs.code}`, ...schemes.map(s => `incentives:${s.scheme}`)],
        why: `We matched your wording to HS ${hs.code}, then returned every incentive whose prefix covers it (longest prefix wins per scheme).`,
      });
    }

    // ---- intent: landed cost ("landed cost of basmati to UAE")
    if (/landed|cost|cif|fob|duty/.test(p) && !/buyers|find/.test(p)) {
      if (!hs) return brief({ answer: "Which product? Try “Landed cost of basmati to UAE” — I need a product and a destination.", sources: [] });
      const qty = Number((p.match(/([\d,.]+)\s*(mt|tonnes?|kg|units?|cartons?)/i) ?? [])[1]?.replace(/[,.]/g, "") ) || 1000;
      const input: any = { mode: cc ? "export" : "import", hsCode: hs.code, quantity: qty, unitValueInr: 220, country: cc ?? "US", freight: "sea" };
      const out = computeLandedCost(input);
      if ("error" in out) return brief({ error: out.error });
      return brief({
        answer: `${hs.description} (${hs.code}), ${qty.toLocaleString("en-IN")} units @ ₹220/unit ${cc ? `into ${countries.find(c => c.code === cc)?.name}` : "(default US case)"}: landed total ₹${out.total.toLocaleString("en-IN")} ≈ ₹${out.perUnit.toLocaleString("en-IN")}/unit. Duty basis ${out.ftaPct !== null ? `${out.ftaPct}% under ${out.agreement}` : `${out.mfnPct}% MFN`}. Open the calculator to change quantity and Incoterm.`,
        data: { hs, result: out, inputs: input },
        sources: [`hs_codes:${hs.code}`, ...(out.agreement ? [`fta_rates:${out.agreement}`] : []), "pricing engine: computeLandedCost()"],
        why: "One call into the same landed-cost engine the calculator uses — ex-works → FOB → CIF build-up with duty lines shown verbatim below.",
      });
    }

    // ---- intent: fta ("is there an fta / agreement")
    if (/fta|agreement|cepa|ecta|atiga|preferential/.test(p)) {
      if (!hs || !cc) return brief({ answer: "Name both a product and a country — e.g. “FTA for cumin to Thailand”.", sources: [] });
      const ftaRow = db().prepare(`SELECT * FROM fta_rates WHERE country_code=? AND (? LIKE hs_prefix || '%') ORDER BY LENGTH(hs_prefix) DESC LIMIT 1`).get(cc, hs.code) as any;
      if (!ftaRow) return brief({ answer: `No India FTA on file gives a preferential rate for ${hs.description} into ${countries.find(c => c.code === cc)?.name}. Buyer pays MFN (${hs.bcd_pct}% reference).`, sources: ["fta_rates table (no match)"] });
      return brief({
        answer: `${ftaRow.agreement} covers ${hs.code} into ${countries.find(c => c.code === cc)?.name}: preferential ${ftaRow.preferential_pct}% vs MFN ${hs.bcd_pct}%. In force since ${ftaRow.in_force_since}. Certificate: ${ftaRow.coo_form}.`,
        data: { hs, fta: ftaRow },
        sources: [`fta_rates:${ftaRow.agreement}:${ftaRow.hs_prefix}`, `hs_codes:${hs.code}`],
        why: `Longest-prefix match in the FTA rate table for country ${cc}; rules-of-origin note carried along so you don't quote zero-duty blindly.`,
      });
    }

    // ---- default intent: buyer search ("buyers for turmeric in the UK")
    const results = searchBuyers(String(prompt), { country: cc ?? undefined }, "match").slice(0, 5);
    if (!results.length) return brief({ answer: `No directory matches for “${prompt}”. Try a product word (“turmeric”), an HS code (“0909”), or a country name.`, sources: ["buyers table (empty result)"] });
    return brief({
      answer: `${results.length} strong buyer matches${cc ? ` in ${countries.find(c => c.code === cc)?.name}` : ""}: ${results.map(r => `${r.flag} ${r.company_name} (${r.matchScore})`).join(", ")}. Open Find buyers to see all and unlock contacts.`,
      data: { buyers: results.map(r => ({ id: r.id, name: r.company_name, city: r.city, country: r.country, score: r.matchScore, products: r.products.map(x => x.product_name), emailMasked: r.emailMasked })) },
      sources: [`buyer_products LIKE '%${(codeMatch?.[1] ?? "product term")}%'`, "match engine: product 60 + market 20 + completeness 12 + recency 8"],
      why: results[0]?.matchSentence ?? "",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Ask failed." }, { status: 500 });
  }
}
