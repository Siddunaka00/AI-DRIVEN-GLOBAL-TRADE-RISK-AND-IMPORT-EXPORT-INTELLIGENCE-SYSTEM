// Seed runner: npm run seed  → creates the full demo world.
import { db, createUser, findUserByEmail, log } from "../src/lib/db";
import { COUNTRIES, HS_CODES, BUYERS } from "./seed-data";

const d = db();

d.transaction(() => {
  // wipe (idempotent re-seed)
  for (const t of ["outreach_list","scenarios","documents","unlocks","saved_buyers","audit_log","buyer_contacts","buyer_products","buyers","incentives","fta_rates","hs_codes","countries"]) {
    d.exec(`DELETE FROM ${t}`);
  }
  d.exec("DELETE FROM sessions");
  if (!findUserByEmail("demo@harborline.test")) createUser({ email: "demo@harborline.test", password: "harborline", fullName: "Demo Exporter", company: "Konkan Spice Exports Pvt Ltd" });
  else d.prepare("UPDATE users SET credits = 3 WHERE email='demo@harborline.test'").run();

  const insC = d.prepare("INSERT INTO countries (code,name,region,flag,currency) VALUES (?,?,?,?,?)");
  for (const c of COUNTRIES) insC.run(...c);

  const insH = d.prepare("INSERT INTO hs_codes (code,description,chapter,gst_pct,bcd_pct,policy,licence_note,skill_note) VALUES (?,?,?,?,?,?,?,?)");
  for (const h of HS_CODES) insH.run(...h);

  // FTA rates — India's agreements relevant to the seeded markets (illustrative sample rates).
  const insF = d.prepare("INSERT INTO fta_rates (agreement,country_code,hs_prefix,preferential_pct,in_force_since,coo_form,roo_note) VALUES (?,?,?,?,?,?,?)");
  const A = "India–UAE CEPA", T = "ASEAN–India (ATIGA)", E = "India–Australia ECTA";
  insF.run(A,"AE","09",0,  "2022-05-01","CEPA COO via ICEGATE/DGFT","Tariff elimination on most Ch.09 spices; RFNC list requires minimal processing (cleaning/sorting qualifies).")
  insF.run(A,"AE","1006",5,"2022-05-01","CEPA COO via ICEGATE/DGFT","Basmati gets a reduced concessionary rate, not zero; check the exact 8-digit line in the CEPA schedule.")
  insF.run(A,"AE","61",0, "2022-05-01","CEPA COO","Change-of-chapter rule for knitted apparel — Indian yarn/knit fabric satisfies it.")
  insF.run(A,"AE","63",0, "2022-05-01","CEPA COO","Wholly obtained from Indian fabric; straightforward for bed linen made in India.")
  insF.run(A,"AE","30",0, "2022-05-01","CEPA COO","Pharmaceuticals: change-of-classification rule met by Indian manufacture.")
  insF.run(A,"AE","84",0, "2022-05-01","CEPA COO","Machinery: value-added ≥20% or CC rule — verify casting origin.")
  insF.run(A,"AE","33",0, "2022-05-01","CEPA COO","Essential oils distilled in India qualify.")
  insF.run(A,"AE","42",5, "2022-05-01","CEPA COO","Leather goods phased down; still better than MFN 50% UAE tariff lines.")
  insF.run(T,"TH","09",0, "2010-01-01","Form AI (DFA Thailand)","ATIGA: intra-ASEAN+India full elimination on most spice lines; wholly-produced rule applies.")
  insF.run(T,"TH","63",5, "2010-01-01","Form AI","Textiles sensitive list — partial concession only.")
  insF.run(T,"TH","84",0, "2010-01-01","Form AI","Machinery largely eliminated under ATIGA.")
  insF.run(E,"AU","09",0, "2022-07-01","COO under ECTA (self-certified possible)","ECTA removes duties on most spices; note some lines were already MFN-free for Australia.")
  insF.run(E,"AU","61",0, "2022-07-01","COO ECTA","Knit apparel: change-of-classification from yarn onwards; cotton yarn may come from FTA partners.")
  insF.run(E,"AU","63",0, "2022-07-01","COO ECTA","Bed linen qualifies if produced from non-origin fabric no more than two stages ahead.")
  insF.run(E,"AU","84",0, "2022-07-01","COO ECTA","Engineering goods duty-free; many lines were already MFN 5%→0 under concessions.")
  insF.run(E,"AU","33",0, "2022-07-01","COO ECTA","Essential oils duty-free.")
  insF.run(E,"AU","30",0, "2022-07-01","COO ECTA","Generic medicines duty-free into Australia.")
  insF.run(E,"AU","42",0, "2022-07-01","COO ECTA","Leather goods duty-free.")
  insF.run(E,"AU","1006",0,"2022-07-01","COO ECTA","Rice: review sensitive-list carve-outs before quoting zero-duty.")

  // Incentives — clearly illustrative sample rates.
  const insI = d.prepare("INSERT INTO incentives (scheme,hs_prefix,rate_pct,mode,steps) VALUES (?,?,?,?,?)");
  const rodop = ["File shipping bill on ICEGATE with RoDTEP flag","ADG code + rate auto-suggested at e-consumption","Scrip credited to ICEGATE RoDTEP wallet within ~10 days","Transfer scrip to bank/PO or use against import duty"];
  const dd = ["Claim in shipping bill itself (Drawback mode)","Rates per All India Importable Rates (AIR) table","CHA files drawback claim after EBD","Amount credited to exporter bank account (NEFT), typically 2–3 weeks"];
  insI.run("RoDTEP (illustrative sample rate)","09",1.5,"ICEGATE scrip", JSON.stringify(rodop));
  insI.run("RoDTEP (illustrative sample rate)","1006",1.0,"ICEGATE scrip", JSON.stringify(rodop));
  insI.run("RoDTEP (illustrative sample rate)","61",4.0,"ICEGATE scrip", JSON.stringify(rodop));
  insI.run("RoDTEP (illustrative sample rate)","62",4.0,"ICEGATE scrip", JSON.stringify(rodop));
  insI.run("RoDTEP (illustrative sample rate)","63",3.5,"ICEGATE scrip", JSON.stringify(rodop));
  insI.run("RoDTEP (illustrative sample rate)","30",2.0,"ICEGATE scrip", JSON.stringify(rodop));
  insI.run("RoDTEP (illustrative sample rate)","33",3.0,"ICEGATE scrip", JSON.stringify(rodop));
  insI.run("RoDTEP (illustrative sample rate)","07",2.5,"ICEGATE scrip", JSON.stringify(rodop));
  insI.run("RoDTEP (illustrative sample rate)","84",1.8,"ICEGATE scrip", JSON.stringify(rodop));
  insI.run("RoDTEP (illustrative sample rate)","42",4.0,"ICEGATE scrip", JSON.stringify(rodop));
  insI.run("Duty drawback AIR (illustrative)","09",1.2,"Bank credit via drawback", JSON.stringify(dd));
  insI.run("Duty drawback AIR (illustrative)","1006",0.8,"Bank credit via drawback", JSON.stringify(dd));
  insI.run("Duty drawback AIR (illustrative)","61",3.1,"Bank credit via drawback", JSON.stringify(dd));
  insI.run("Duty drawback AIR (illustrative)","63",2.9,"Bank credit via drawback", JSON.stringify(dd));
  insI.run("RoSCTL (apparel only — illustrative)","61",4.2,"Bank credit (per FOB slab)", JSON.stringify(["Register firm with DGFT/RoSS portal","Apply for certificate slab per unit FOB band","Submit with shipping bill data","Refund credited monthly to registered bank account"]));
  insI.run("RoSCTL (apparel only — illustrative)","62",3.6,"Bank credit (per FOB slab)", JSON.stringify(["Register firm with DGFT/RoSS portal","Apply for certificate slab per unit FOB band","Submit with shipping bill data","Refund credited monthly to registered bank account"]));

  // Buyers
  const insB = d.prepare("INSERT INTO buyers (company_name,legal_name,country_code,city,company_type,year_founded,employee_band,verification,verified_on,order_size_band,incoterms,ports,address,profile_completeness) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  const insBP = d.prepare("INSERT INTO buyer_products (buyer_id,hs_code,product_name,fit_note) VALUES (?,?,?,?)");
  const insBC = d.prepare("INSERT INTO buyer_contacts (buyer_id,kind,value,last_checked) VALUES (?,?,?,?)");
  for (const b of BUYERS) {
    const info = insB.run(b.name, b.legal ?? null, b.cc, b.city, b.type, b.year, b.band, b.ver, b.von, b.size, b.inco, JSON.stringify(b.ports), b.addr, b.comp);
    const id = Number(info.lastInsertRowid);
    for (const p of b.prods) insBP.run(id, ...p);
    for (const c of b.contacts) insBC.run(id, c[0], c[1], b.von);
  }
  log(null, "seed", `Seeded ${BUYERS.length} buyers, ${HS_CODES.length} HS codes, ${COUNTRIES.length} countries.`);
})();

console.log(`Seed complete: ${d.prepare("SELECT COUNT(*) n FROM buyers").get()} buyers.`);
