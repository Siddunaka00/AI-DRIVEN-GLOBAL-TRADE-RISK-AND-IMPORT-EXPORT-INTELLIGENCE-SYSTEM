// Trade-document generator: pure HTML out (prints to PDF via the browser), no
// headless-Chrome dependency. Prefills from real buyer + HS records.
import { db } from "./db";
import { lookupHs, findFta } from "./pricing";

export interface DocInput {
  kind: "proforma" | "commercial" | "packing" | "quotation";
  buyerId?: number;
  hsCode: string;
  quantity: number;
  unitValueInr: number;   // FOB INR per unit
  freightInr?: number;
  insuranceInr?: number;
  incoterm?: string;      // default = buyer's usual term if known
  currency?: string;      // display note only
  packSize?: number;      // units per carton (packing list)
  sellerName?: string; sellerAddress?: string;
}

const KIND_TITLE: Record<DocInput["kind"], string> = {
  proforma: "PROFORMA INVOICE", commercial: "COMMERCIAL INVOICE", packing: "PACKING LIST", quotation: "QUOTATION",
};

export function generateDocument(input: DocInput): { title: string; html: string } | { error: string } {
  const d = db();
  const hs = lookupHs(input.hsCode);
  if (!hs) return { error: `HS ${input.hsCode} not found — pick a code in the HS workspace first.` };
  if (!(input.quantity > 0) || !(input.unitValueInr > 0)) return { error: "Quantity and unit value must be positive." };
  let buyer: any = null;
  if (input.buyerId) buyer = d.prepare("SELECT b.*, c.name AS country FROM buyers b JOIN countries c ON c.code=b.country_code WHERE b.id=?").get(input.buyerId);
  const products = buyer ? (d.prepare("SELECT product_name, hs_code FROM buyer_products WHERE buyer_id=? LIMIT 1").get(buyer.id) as any) : null;
  const qty = input.quantity, uv = input.unitValueInr;
  const fob = qty * uv;
  const freight = input.freightInr ?? Math.round(fob * 0.06);
  const insurance = input.insuranceInr ?? Math.round(fob * 0.0035);
  const cif = fob + freight + insurance;
  const docNo = "HL-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);
  const sellerName = input.sellerName || "Konkan Spice Exports Pvt Ltd";
  const sellerAddr = input.sellerAddress || "Plot 14, MIDC Industrial Area, Panaji, Goa 400101, India · IEC: AABCK1234F · GSTIN: 30AABCK1234F1ZV";
  const incoterm = input.incoterm || (buyer ? buyer.incoterms : "FOB Nhava Sheva") || "FOB Nhava Sheva";
  const itemName = products?.product_name || hs.description;
  const inco = (v: number) => "₹" + v.toLocaleString("en-IN");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const fta = buyer ? findFta(buyer.country_code, hs.code) : null;

  const shipBlock = buyer ? `
    <div class="cols"><div><h3>Buyer / Consignee</h3><p>${esc(buyer.company_name)}${buyer.legal_name && buyer.legal_name !== buyer.company_name ? "<br/>" + esc(buyer.legal_name) : ""}<br/>${esc(buyer.address || "")}<br/>${esc(buyer.city)}, ${esc(buyer.country)}</p></div>
    <div><h3>Shipment</h3><p>Port of loading: Mumbai / Nhava Sheva<br/>Destination: ${(JSON.parse(buyer.ports || "[]")[0] || esc(buyer.city))}<br/>Terms: ${esc(incoterm)}<br/>Country of origin: India</p></div></div>`
    : `<div class="cols"><div><h3>Buyer / Consignee</h3><p>To be advised — open this document from a buyer profile to prefill.</p></div><div><h3>Shipment</h3><p>Terms: ${esc(incoterm)}<br/>Country of origin: India</p></div></div>`;

  const dutyNote = fta && fta.preferential_pct >= 0
    ? `Buyer-side duty under ${fta.agreement}: ${fta.preferential_pct}% (MFN reference ${hs.bcd_pct}%). Certificate of origin: ${fta.coo_form}.`
    : `No preferential rate on file for ${buyer ? buyer.country : "destination"} — MFN reference duty ${hs.bcd_pct}%.`;

  let bodyHtml = "";
  if (input.kind === "packing") {
    const packs = input.packSize && input.packSize > 0 ? input.packSize : 25;
    const cartons = Math.ceil(qty / packs);
    bodyHtml = `<table><thead><tr><th>#</th><th>Description</th><th>HS</th><th>Pack size</th><th>Cartons</th><th>Units</th></tr></thead>
      <tbody><tr><td>1</td><td>${esc(itemName)}</td><td>${hs.code}</td><td>${packs}/carton</td><td>${cartons}</td><td>${qty.toLocaleString("en-IN")}</td></tr></tbody></table>
      <p class="tot">Total cartons: <b>${cartons}</b> · Total units: <b>${qty.toLocaleString("en-IN")}</b> · Est. gross wt: <b>${(cartons * 18).toLocaleString("en-IN")} kg</b> (sample 18 kg/carton)</p>`;
  } else {
    const rows: [string, number][] = [["Goods value (FOB basis)", fob]];
    if (input.kind !== "quotation") rows.push(["Freight estimate", freight], ["Insurance", insurance]);
    bodyHtml = `<table><thead><tr><th>Description of goods</th><th>HS code</th><th>Qty</th><th>Unit (${inco(uv)})</th><th>Amount</th></tr></thead><tbody>
      <tr><td>${esc(itemName)}</td><td>${hs.code}</td><td>${qty.toLocaleString("en-IN")} units</td><td>${inco(uv)}</td><td>${inco(fob)}</td></tr></tbody></table>
      ${rows.map(([l, v]) => `<p class="tot">${l}: <b>${inco(v)}</b></p>`).join("")}
      <p class="tot grand">${input.kind === "quotation" ? "Quoted total (FOB)" : "CIF equivalent"}: <b>${inco(input.kind === "quotation" ? fob : cif)}</b> · Incoterms: ${esc(incoterm)}</p>`;
  }

  const footer = input.kind === "proforma" || input.kind === "commercial"
    ? `<p class="note">${esc(dutyNote)}</p><p class="note">Bank: State Bank of India, Panaji · A/C Konkan Spice Exports · SWIFT SBININBB · This is a sample document generated by TradeIQ for demonstration; verify all values before use.</p>`
    : `<p class="note">Sample document generated by TradeIQ. Verify weights and counts against actual production.</p>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${docNo} · ${KIND_TITLE[input.kind]}</title>
  <style>
    @page{margin:18mm} body{font-family:Georgia,'Times New Roman',serif;color:#14213d;margin:0;padding:28px;background:#fff}
    header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a1916;padding-bottom:12px}
    h1{font-size:20px;margin:0;letter-spacing:.04em} .brand{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#246bfd;font-weight:bold}
    .meta{text-align:right;font-size:12px;line-height:1.7}
    h3{font-size:11px;text-transform:uppercase;letter-spacing:.12em;margin:18px 0 4px;color:#6b675e}
    p{margin:0;font-size:13px;line-height:1.6}
    .cols{display:grid;grid-template-columns:1fr 1fr;gap:24px}
    table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
    th{background:#eaf2ff;text-align:left;padding:7px 9px;border:1px solid #d9d2c4;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
    td{padding:7px 9px;border:1px solid #d9d2c4}
    .tot{text-align:right;margin-top:6px} .grand{font-size:15px;border-top:2px solid #1a1916;padding-top:6px}
    .note{font-size:11px;color:#6b675e;margin-top:14px}
    footer{margin-top:26px;display:flex;justify-content:space-between;font-size:12px}
    .sign{border-top:1px solid #1a1916;width:180px;padding-top:4px}
    @media print{body{padding:0}}
  </style></head><body>
    <header><div><div class="brand">TradeIQ · Document Studio</div><h1>${KIND_TITLE[input.kind]} No. ${docNo}</h1></div>
    <div class="meta">${new Date().toDateString()}<br/>Seller: ${esc(sellerName)}<br/><span style="font-size:11px">${esc(sellerAddr)}</span></div></header>
    ${shipBlock}${bodyHtml}${footer}
    <footer><div class="sign">Authorised signatory</div><div class="sign">For ${esc(sellerName)}</div></footer>
  </body></html>`;
  return { title: `${KIND_TITLE[input.kind]} ${docNo}`, html };
}
