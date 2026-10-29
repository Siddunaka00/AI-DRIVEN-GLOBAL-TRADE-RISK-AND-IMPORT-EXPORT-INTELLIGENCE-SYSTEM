// TradeIQ data layer — SQLite via better-sqlite3.
// Chosen deliberately: zero-ops, file-based (works on a $5 VPS or locally),
// synchronous API keeps route handlers simple, WAL mode handles concurrent reads.
// Swap to Postgres later by replacing this module only; queries are standard SQL.
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let _db: Database.Database | null = null;
export function db(): Database.Database {
  if (_db) return _db;
  _db = new Database(path.join(DATA_DIR, "harborline.db"));
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(d: Database.Database) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    company TEXT,
    plan TEXT NOT NULL DEFAULT 'free',          -- free | pro
    credits INTEGER NOT NULL DEFAULT 3,         -- buyer unlocks remaining
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS countries (
    code TEXT PRIMARY KEY,                      -- ISO2
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    flag TEXT NOT NULL,                         -- emoji flag is data, not decoration
    currency TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS hs_codes (
    code TEXT PRIMARY KEY,                      -- 8-digit ITC-HS
    description TEXT NOT NULL,
    chapter TEXT NOT NULL,
    gst_pct REAL NOT NULL,
    bcd_pct REAL NOT NULL,                      -- basic customs duty (MFN import into India)
    policy TEXT NOT NULL,                       -- Freeable / Restricted etc.
    licence_note TEXT,
    skill_note TEXT NOT NULL                    -- plain-language teaching note
  );
  CREATE TABLE IF NOT EXISTS buyers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    legal_name TEXT,
    country_code TEXT NOT NULL REFERENCES countries(code),
    city TEXT NOT NULL,
    company_type TEXT NOT NULL,                 -- importer|distributor|retailer|manufacturer
    year_founded INTEGER,
    employee_band TEXT,
    verification TEXT NOT NULL DEFAULT 'verified', -- unverified|checked|verified
    verified_on TEXT,
    order_size_band TEXT,
    incoterms TEXT,
    ports TEXT,                                 -- json array
    address TEXT,
    profile_completeness REAL NOT NULL DEFAULT 0.7
  );
  CREATE TABLE IF NOT EXISTS buyer_products (
    buyer_id INTEGER NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    hs_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    fit_note TEXT                               -- why an Indian exporter fits this buyer
  );
  CREATE TABLE IF NOT EXISTS buyer_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,                         -- email|phone|whatsapp|linkedin|website
    value TEXT NOT NULL,
    last_checked TEXT
  );
  CREATE TABLE IF NOT EXISTS fta_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agreement TEXT NOT NULL,
    country_code TEXT NOT NULL REFERENCES countries(code),
    hs_prefix TEXT NOT NULL,                    -- match on first N digits
    preferential_pct REAL NOT NULL,             -- -1 = excluded
    in_force_since TEXT NOT NULL,
    coo_form TEXT NOT NULL,
    roo_note TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS incentives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scheme TEXT NOT NULL,
    hs_prefix TEXT NOT NULL,
    rate_pct REAL NOT NULL,
    mode TEXT NOT NULL,                         -- ICEGATE scrip | Bank credit
    steps TEXT NOT NULL                        -- json array of 4 claim steps
  );
  CREATE TABLE IF NOT EXISTS unlocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, buyer_id)
  );
  CREATE TABLE IF NOT EXISTS saved_buyers (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    saved_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, buyer_id)
  );
  CREATE TABLE IF NOT EXISTS outreach_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id INTEGER NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'to-contact',
    UNIQUE(user_id, buyer_id)
  );
  CREATE TABLE IF NOT EXISTS scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    payload TEXT NOT NULL,                      -- json inputs+result snapshot
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,                         -- proforma|commercial|packing|quotation
    title TEXT NOT NULL,
    html TEXT NOT NULL,
    buyer_id INTEGER REFERENCES buyers(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  `);
}

export function log(userId: number | null, action: string, detail?: string) {
  db().prepare("INSERT INTO audit_log (user_id, action, detail) VALUES (?,?,?)").run(userId, action, detail ?? null);
}

// ---------- users & auth ----------
export interface UserRow {
  id: number; email: string; password_hash: string; full_name: string;
  company: string | null; plan: string; credits: number; created_at: string;
}
export function findUserByEmail(email: string): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as UserRow | undefined;
}
export function createUser(input: { email: string; password: string; fullName: string; company?: string }) {
  const hash = bcrypt.hashSync(input.password, 10);
  const info = db().prepare(
    "INSERT INTO users (email, password_hash, full_name, company, plan, credits) VALUES (?,?,?,?, 'free', 3)"
  ).run(input.email.toLowerCase(), hash, input.fullName, input.company ?? null);
  return Number(info.lastInsertRowid);
}
export function verifyPassword(plain: string, hash: string) { return bcrypt.compareSync(plain, hash); }
export function createSession(userId: number): string {
  const token = Buffer.from(`${userId}:${Date.now()}:${Math.random()}`).toString("base64url");
  db().prepare("INSERT INTO sessions (token, user_id) VALUES (?,?)").run(token, userId);
  return token;
}
export function sessionUserId(token: string | undefined | null): number | null {
  if (!token) return null;
  const row = db().prepare("SELECT user_id FROM sessions WHERE token = ?").get(token) as { user_id: number } | undefined;
  return row?.user_id ?? null;
}
export function destroySession(token: string | undefined | null) {
  if (token) db().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
export function getUserById(id: number): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}
