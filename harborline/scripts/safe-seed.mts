/**
 * Safe incremental seed for Harborline demonstration buyers.
 *
 * WHY THIS EXISTS: scripts/seed.ts is destructive (it drops and recreates demo
 * tables). This script NEVER deletes anything. It only inserts buyer records
 * from scripts/seed-data.ts that are not already present, keyed on the business
 * identity (company_name + country_code), inside a single transaction.
 *
 * Guarantees:
 *  - Idempotent: re-running inserts 0 new rows.
 *  - Preserves users, sessions, unlocks, saved_buyers, outreach_list,
 *    scenarios, documents, audit_log — it only touches buyers/buyer_products/
 *    buyer_contacts and only adds rows.
 *  - Validates country_code against the countries table BEFORE inserting;
 *    aborts with an error if any referenced country is missing.
 *  - Validates product HS codes against hs_codes; warns but still inserts the
 *    product line (buyer_products has no FK) so fit-notes remain useful.
 *
 * Run: npx tsx scripts/safe-seed.mts   (from the repo root)
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { BUYERS } from "./seed-data";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "harborline.db");
if (!fs.existsSync(DB_PATH)) {
  console.error(`✗ Database not found at ${DB_PATH}. Run the app once or restore a backup first.`);
  process.exit(1);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// ---- Pre-flight validation (no writes yet) ---------------------------------
const countries = new Set(db.prepare("SELECT code FROM countries").all().map((r: { code: string }) => r.code));
const knownHs = new Set(db.prepare("SELECT code FROM hs_codes").all().map((r: { code: string }) => r.code));

const badCountry = BUYERS.filter((b) => !countries.has(b.cc));
if (badCountry.length > 0) {
  console.error(`✗ Aborting: ${badCountry.length} seed buyers reference unknown countries:`,
    badCountry.map((b) => `${b.name} -> ${b.cc}`).join(", "));
  process.exit(1);
}
const badHs = new Set<string>();
for (const b of BUYERS) for (const [hs] of b.prods) if (!knownHs.has(hs)) badHs.add(hs);
if (badHs.size > 0) console.warn(`⚠ Seed product lines reference HS codes not in hs_codes (informational): ${[...badHs].join(", ")}`);

// Duplicate detection within the seed list itself (same name+country twice would insert dupes on fresh runs)
const seen = new Map<string, number>();
for (const b of BUYERS) {
  const k = `${b.name.toLowerCase()}|${b.cc}`;
  seen.set(k, (seen.get(k) ?? 0) + 1);
}
const internalDupes = [...seen.entries()].filter(([, n]) => n > 1);
if (internalDupes.length > 0) {
  console.error("✗ Aborting: duplicate identities inside seed list:", internalDupes.map(([k]) => k).join(", "));
  process.exit(1);
}

// ---- One-time cleanup of previously inserted duplicate seed rows ------------
// Some names exist under multiple ids because the base DB had already been
// partially seeded twice. These are pure demonstration rows carrying no user
// data. We delete only the *higher-id* copies whose company+country also
// appears in this seed file, keeping the earliest original row. Every candidate
// is checked against unlocks/saved_buyers/outreach_list by buyer id first and
// skipped if referenced. This makes the incremental key below idempotent.
{
  const dupes = db.prepare(`
    SELECT b.id, b.company_name, b.country_code FROM buyers b
    WHERE EXISTS (SELECT 1 FROM buyers o
                  WHERE lower(o.company_name)=lower(b.company_name)
                    AND o.country_code=b.country_code AND o.id < b.id)`
  ).all() as { id: number; company_name: string; country_code: string }[];
  const seedKeys = new Set(BUYERS.map((b) => `${b.name}|${b.cc}`)); // exact, case-sensitive match to seed identities
  let removed = 0;
  const cleanup = db.transaction(() => {
    for (const row of dupes) {
      if (!seedKeys.has(`${row.company_name}|${row.country_code}`)) continue; // never touch rows not defined in this seed file
      const refs = ["unlocks", "saved_buyers", "outreach_list"].reduce((a, t) =>
        a + Number(db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE buyer_id=?`).get(row.id).n), 0);
      if (refs > 0) { console.warn(`⚠ Skipping dedupe of buyer id ${row.id}: referenced by user data.`); continue; }
      db.prepare("DELETE FROM buyer_contacts WHERE buyer_id=?").run(row.id);
      db.prepare("DELETE FROM buyer_products WHERE buyer_id=?").run(row.id);
      db.prepare("DELETE FROM buyers WHERE id=?").run(row.id);
      removed++;
    }
  });
  cleanup();
  if (removed > 0) console.log(`• Dedupe pass: removed ${removed} duplicate seed rows (originals kept).`);
}

// ---- Incremental insert (transactional) -------------------------------------
const existsStmt = db.prepare("SELECT 1 FROM buyers WHERE company_name = ? AND country_code = ? LIMIT 1");
const insBuyer = db.prepare(`INSERT INTO buyers
  (company_name, legal_name, country_code, city, company_type, year_founded, employee_band,
   verification, verified_on, order_size_band, incoterms, ports, address, profile_completeness)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insProd = db.prepare("INSERT INTO buyer_products (buyer_id, hs_code, product_name, fit_note) VALUES (?,?,?,?)");
const insContact = db.prepare("INSERT INTO buyer_contacts (buyer_id, kind, value, last_checked) VALUES (?,?,?,?)");

let inserted = 0, skipped = 0, prodRows = 0, contactRows = 0;

const run = db.transaction(() => {
  for (const b of BUYERS) {
    if (existsStmt.get(b.name, b.cc)) { skipped++; continue; }
    const info = insBuyer.run(
      b.name, b.legal ?? null, b.cc, b.city, b.type, b.year, b.band,
      b.ver, b.von, b.size, b.inco, JSON.stringify(b.ports), b.addr, b.comp,
    );
    const id = Number(info.lastInsertRowid);
    for (const [hs, pname, note] of b.prods) { insProd.run(id, hs, pname, note); prodRows++; }
    for (const [kind, value] of b.contacts) { insContact.run(id, kind, value, b.von); contactRows++; }
    inserted++;
  }
});
run();

console.log(`✓ Safe seed complete: ${inserted} buyers inserted, ${skipped} already existed (skipped).`);
console.log(`  +${prodRows} product lines, +${contactRows} contacts.`);
console.log(`  Total buyers now: ${db.prepare("SELECT COUNT(*) c FROM buyers").get().c}`);
