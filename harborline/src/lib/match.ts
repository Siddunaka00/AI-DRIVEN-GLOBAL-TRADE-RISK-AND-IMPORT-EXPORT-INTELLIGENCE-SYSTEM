// Transparent buyer-match scoring. No black box: every point of the score is
// attributable to a named factor with a sentence, per the product principles.
import { db } from "./db";

export interface MatchFactor { key: string; label: string; points: number; max: number; sentence: string; }
export interface ScoredBuyer {
  id: number; company_name: string; city: string; country_code: string; flag: string; country: string;
  company_type: string; verification: string; verified_on: string | null;
  products: { hs_code: string; product_name: string; fit_note: string | null }[];
  contactCount: number; emailMasked: string | null; phoneMasked: string | null;
  matchScore: number; matchSentence: string; factors: MatchFactor[];
}

function maskEmail(v: string) { const [l, d] = v.split("@"); return `${l[0]}***@${d}`; }
function maskPhone(v: string) { return v.replace(/\d(?=\d{4})/g, "•"); }

const STOP = new Set(["in", "the", "of", "and", "for", "usa", "uk"]);

export function searchBuyers(qRaw: string, filters: {
  country?: string; region?: string; category?: string; type?: string;
  verified?: boolean; hasEmail?: boolean; hasPhone?: boolean; hasLinkedIn?: boolean;
}, sort: "match" | "recent" | "complete" = "match"): ScoredBuyer[] {
  const q = qRaw.trim().toLowerCase();
  const terms = q.split(/[\s,]+/).filter(t => t && !STOP.has(t));
  const d = db();

  const where: string[] = []; const args: any[] = [];
  if (filters.country) { where.push("b.country_code = ?"); args.push(filters.country); }
  if (filters.region) { where.push("c.region = ?"); args.push(filters.region); }
  if (filters.type) { where.push("b.company_type = ?"); args.push(filters.type); }
  if (filters.verified) { where.push("b.verification = 'verified'"); }
  const having: string[] = [];
  if (filters.hasEmail) having.push("SUM(CASE WHEN kc.kind='email' THEN 1 ELSE 0 END) > 0");
  if (filters.hasPhone) having.push("SUM(CASE WHEN kc.kind IN ('phone','whatsapp') THEN 1 ELSE 0 END) > 0");
  if (filters.hasLinkedIn) having.push("SUM(CASE WHEN kc.kind='linkedin' THEN 1 ELSE 0 END) > 0");

  const buyers = d.prepare(`
    SELECT b.*, c.name AS country, c.flag,
      (SELECT COUNT(*) FROM buyer_contacts k WHERE k.buyer_id=b.id) AS contact_count,
      (SELECT value FROM buyer_contacts k WHERE k.buyer_id=b.id AND k.kind='email' LIMIT 1) AS email,
      (SELECT value FROM buyer_contacts k WHERE k.buyer_id=b.id AND k.kind IN ('phone','whatsapp') LIMIT 1) AS phone,
      (SELECT kind FROM buyer_contacts k WHERE k.buyer_id=b.id AND k.kind='linkedin' LIMIT 1) AS has_li
    FROM buyers b JOIN countries c ON c.code=b.country_code
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
  `).all(...args) as any[];

  let out = buyers.map(b => {
    const products = d.prepare("SELECT hs_code, product_name, fit_note FROM buyer_products WHERE buyer_id=?").all(b.id) as any[];
    // ---- factor 1: product/HS/text match (max 60)
    let productPoints = 0; const matchedProducts: string[] = [];
    if (terms.length === 0) { productPoints = 30; }
    for (const p of products) {
      const hay = (p.product_name + " " + p.hs_code).toLowerCase();
      const hit = terms.some(t => hay.includes(t) || t.startsWith(p.hs_code.slice(0, Math.min(4, t.length)) && p.hs_code.startsWith(t)));
      if (hit) { productPoints += 25; matchedProducts.push(p.product_name); }
    }
    productPoints = Math.min(productPoints, 60);
    // ---- factor 2: market/country fit (max 20) — term mentions country or filter set
    let marketPoints = 10;
    const hay = (b.country + " " + b.city + " " + b.country_code).toLowerCase();
    if (terms.some(t => hay.includes(t))) marketPoints = 20;
    if (filters.country === b.country_code) marketPoints = 20;
    if (terms.length === 0) marketPoints = 10;
    // ---- factor 3: profile completeness (max 12)
    const completenessPts = Math.round((b.profile_completeness ?? 0.5) * 12);
    // ---- factor 4: recency of verification (max 8)
    let recencyPts = 0;
    if (b.verified_on) {
      const days = (Date.now() - new Date(b.verified_on + "Z").getTime()) / 86400000;
      recencyPts = days < 90 ? 8 : days < 180 ? 6 : days < 365 ? 4 : 2;
    }
    const factors: MatchFactor[] = [
      { key: "product", label: "Product & HS fit", points: productPoints, max: 60,
        sentence: matchedProducts.length ? `Imports ${matchedProducts.join(" and ")} — direct overlap with your query.` : terms.length ? "No product-line overlap found; shown only because other filters matched." : "No query given — neutral product score." },
      { key: "market", label: "Market", points: marketPoints, max: 20,
        sentence: `${b.company_name} is an active ${b.company_type} in ${b.city}, ${b.country}.` },
      { key: "completeness", label: "Contact completeness", points: completenessPts, max: 12,
        sentence: `${b.contact_count} contact channels on file, verified directory record.` },
      { key: "recency", label: "Verification recency", points: recencyPts, max: 8,
        sentence: b.verified_on ? `Profile checked ${b.verified_on}.` : "Not recently re-checked." },
    ];
    const score = Math.min(100, factors.reduce((s, f) => s + f.points, 0));
    const top = factors.filter(f => f.points / f.max >= 0.7).map(f => f.label.toLowerCase());
    const matchSentence = terms.length
      ? `${score}/100 — strong on ${top.length ? top.join(" + ") : "general fit"}${matchedProducts.length ? `; buys ${matchedProducts[0]}` : ""}.`
      : `${score}/100 — directory listing sorted by profile quality.`;
    return {
      id: b.id, company_name: b.company_name, city: b.city, country_code: b.country_code,
      flag: b.flag, country: b.country, company_type: b.company_type, verification: b.verification,
      verified_on: b.verified_on, products, contactCount: b.contact_count,
      emailMasked: b.email ? maskEmail(b.email) : null, phoneMasked: b.phone ? maskPhone(b.phone) : null,
      matchScore: score, matchSentence, factors,
    } as ScoredBuyer;
  });

  if (filters.category) out = out.filter(o => o.products.some(p => p.hs_code.slice(0, 2) === categoryPrefix(filters.category!)));
  if (q) out = out.filter(o => o.matchScore > 30);
  if (sort === "recent") out.sort((a, b) => (b.verified_on ?? "").localeCompare(a.verified_on ?? ""));
  else if (sort === "complete") out.sort((a, b) => b.contactCount - a.contactCount || b.matchScore - a.matchScore);
  else out.sort((a, b) => b.matchScore - a.matchScore || b.contactCount - a.contactCount);
  return out;
}

function categoryPrefix(cat: string) {
  const map: Record<string, string> = { spices: "09", rice: "10", textiles: "63", apparel: "61", pharma: "30", oils: "33", vegetables: "07", engineering: "84", leather: "42", jewellery: "71" };
  return map[cat.toLowerCase()] ?? "";
}

export function buyerDetail(id: number, unlocked: boolean) {
  const d = db();
  const b = d.prepare(`SELECT b.*, c.name AS country, c.flag, c.region FROM buyers b JOIN countries c ON c.code=b.country_code WHERE b.id=?`).get(id) as any;
  if (!b) return null;
  const contacts = d.prepare("SELECT kind, value, last_checked FROM buyer_contacts WHERE buyer_id=?").all(id) as any[];
  const products = d.prepare("SELECT hs_code, product_name, fit_note FROM buyer_products WHERE buyer_id=?").all(id) as any[];
  const masked = contacts.map(c => ({
    kind: c.kind, lastChecked: c.last_checked,
    value: unlocked ? c.value : c.kind === "email" ? maskEmail(c.value) : c.kind === "phone" || c.kind === "whatsapp" ? maskPhone(c.value) : c.kind === "website" || c.kind === "linkedin" ? (unlocked ? c.value : "•••• (unlock to view)") : c.value,
  }));
  return { ...b, contacts: masked, realContactCount: contacts.length, products };
}
