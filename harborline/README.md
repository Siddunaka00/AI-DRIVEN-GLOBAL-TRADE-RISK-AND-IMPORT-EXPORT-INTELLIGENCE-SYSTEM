# TradeIQ — AI-Driven Global Trade Risk and Import-Export Intelligence System

**India-first import-export intelligence for SMEs (academic university major project).** TradeIQ takes an Indian exporter or importer from a product idea to an overseas buyer record, a landed-cost estimate, the right HS code, FTA savings, export incentives, and a ready trade document — in one workspace.

> **This is a non-commercial academic demonstration. Every feature is available free of charge.** There are no subscription plans, no payments, and no credit purchases anywhere in the product. Buyer contact unlocking is completely free for signed-in users. The legacy `credits` column in the SQLite database remains only for backward compatibility with earlier builds and is never deducted or enforced.

> All buyers, contacts, duty rates, FTA preferences, and incentive figures in this build are **clearly-labeled demonstration data** seeded locally. They are directory-shaped and internally consistent, but they are not sourced from a live verified provider and must not be used for actual shipping decisions.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 |
| Language | TypeScript 5.5 (strict) |
| Styling | Tailwind CSS 3.4 with CSS-variable theming (light + dark) |
| Animation | CSS keyframes/transitions (`rise`, `stagger`, `lift`) honoring `prefers-reduced-motion`; framer-motion available |
| Database | SQLite via `better-sqlite3` (file: `data/harborline.db`) |
| Auth | Email + password, bcryptjs hashing, DB-backed session cookie |
| Validation | zod on API routes |

No external services are required to run the app. There is no Postgres/Redis dependency in this build.

## Getting started

```bash
npm install          # installs deps from package.json / package-lock.json
npm run dev          # http://localhost:3000
```

**Demo login:** `demo@harborline.test` / `harborline`. All features are free; no plan or credit purchase is required.

### Environment variables

None are required for normal operation. The database path is fixed at `data/harborline.db` (created automatically). The safe seeder accepts an optional override:

```bash
DATABASE_PATH=/some/path/harborline.db npm run seed:safe   # example placeholder, not a secret
```

### npm scripts (actual, from package.json)

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build on port 3000 |
| `npm run lint` | `next lint` (ESLint with `next/core-web-vitals`) |
| `npm run seed` | **DESTRUCTIVE** full reseed — drops and recreates demo tables. Do not run against a database with user data you care about. |
| `npm run seed:safe` | **Non-destructive incremental seed** — see "Safe seeding" below. |

Type-check separately with `npx tsc --noEmit`.

## Routes

### Public pages
| Route | Purpose |
|---|---|
| `/` | Home: headline, live buyer search that routes into results, proof points, product walkthrough, "Why this exists" section |
| `/buyers` | Buyer directory search (split view; also reachable from home search) |
| `/buyers/[id]` | Full buyer profile (contacts masked until unlocked) |
| `/pricing` | Project Features page — academic build, no plans, credits or payments (also the redirect target for `/features`) |
| `/features` | Redirects to `/pricing` (Project Features) |
| `/about` | About this university major project |
| `/login` · `/register` | Authentication (`?next=` deep-link redirect preserved) |

Marketing tool landing pages (`/find-buyers`, `/hs-code`, `/landed-cost`, `/fta-checker`, `/incentives`, `/document-studio`) route into the same working tools.

### Authenticated workspace (`/app/*`, redirects to `/login?next=…` when signed out)
| Route | Purpose |
|---|---|
| `/app` | Command home: recent unlocks, saved buyers, scenarios, documents, activity feed (no credit/plan widgets — all features are free) |
| `/app/buyers` | Buyer search split view inside the workspace shell |
| `/app/buyers/[id]` | Buyer profile (shared component with public route) |
| `/app/saved` | Saved buyers and outreach list |
| `/app/hs` | HS lookup |
| `/app/cost` | Landed-cost calculator |
| `/app/costs` | Saved cost-scenario library |
| `/app/fta` | FTA checker |
| `/app/incentives` | Incentive finder |
| `/app/documents` | Document Studio + history |
| `/app/ask` | Ask Harborline (deterministic brief router over the app's own APIs) |
| `/app/account` | Profile, security, usage history, data export, account deletion (no billing or credit-purchase sections) |

## Features

- **Buyer discovery & profiles.** One search field accepts product names, common names, or partial HS codes ("cumin", "basmati rice", "0909", "cotton t-shirts USA"). Filters for country, category, company type, verification level, contact availability; sort by match score, recency, completeness. Split view on desktop; list → full-screen profile sheet on mobile. Match scores always come with a plain-language reason (country fit, product fit, profile completeness) — no black-box numbers.
- **Contact unlocking — free.** Company name, city, products, and masked contacts (`e***@domain.com`) are always visible; direct contact fields unlock for **free** once a user is signed in. No credits are deducted and no upgrade is ever offered. Unlock records persist per user in SQLite (for activity history and auditing), survive refresh, and repeated requests do not create duplicate rows. Every unlock writes an audit row shown on the profile ("Unlocked by you on … Source: Harborline demonstration directory record"). The legacy `credits` column remains in the schema only for backward compatibility and is unused.
- **HS lookup.** Search by code or name; returns description, chapter, GST, basic customs duty, policy/licence notes, plus a plain-language "what this code means for your shipment" skills note. Cross-links to buyers, calculator, FTA, and incentives for the same code.
- **Landed cost.** Export-from-India and import-into-India modes; ex-works → FOB → CIF build-up, then duty, surcharge, IGST, and per-unit landed cost. MFN vs FTA shown side by side where an agreement exists. Scenarios save to the database (`/app/costs`).
- **FTA checker.** India–UAE CEPA, Australia ECTA, ASEAN (Thailand), and a generic no-agreement case, with MFN vs preferential rates, certificate-of-origin steps, and rules-of-origin warnings. Rates are illustrative samples, labeled as such.
- **Incentives.** RoDTEP, duty-drawback AIR, and RoSCTL (apparel only) sample rates with a 4-step claim path. Clearly marked *illustrative* — not official government rates.
- **Document Studio.** Proforma invoice, commercial invoice, packing list, and quotation generated as printable HTML (print-to-PDF from the browser). Opening from a buyer profile prefills buyer name, address, and product. Documents persist per user with status badges. No legal-certification claims.
- **Ask Harborline.** A prompt box that classifies intent and calls the app's own APIs (buyer search, cost engine, incentives), returning a structured brief: answer, the records/numbers used, and why. It is deterministic retrieval, **not** an external LLM.
- **Account & data controls.** Edit profile, change password (verifies current password, revokes other sessions), view activity/usage history, download a JSON export of all your data, and delete your account with typed confirmation (cascades your rows, clears the session). No billing, plan, or credit-purchase sections exist — everything is free.

## Authentication & sessions

Email + password with bcrypt hashes (`password_hash` column; never sent to the client). Login issues an httpOnly session cookie backed by the `sessions` table; logout deletes it. Workspace pages call `currentUser()` server-side and redirect to `/login?next=<path>`; the login page honors `next`. Password changes revoke all other sessions.

## Database

SQLite file `data/harborline.db`, created and schema-initialized on first use. Tables: `users`, `sessions`, `countries`, `hs_codes`, `buyers`, `buyer_products`, `buyer_contacts`, `fta_rates`, `incentives`, `unlocks`, `saved_buyers`, `outreach_list`, `scenarios`, `documents`, `audit_log`. Foreign keys enforced; buyer children cascade on delete.

## Safe seeding (expanding the demo directory)

`scripts/safe-seed.mts` adds any missing demonstration buyers from `scripts/seed-data.ts` without touching anything else:

```bash
cp data/harborline.db data/harborline.db.bak-$(date +%Y%m%d-%H%M%S)   # back up first (never overwrite a backup)
npm run seed:safe                                                     # idempotent — re-run inserts 0 rows
```

Guarantees: pre-flight validation of every referenced country (aborts on unknown codes); duplicate detection inside the seed list; a guarded dedupe pass that removes only higher-id copies of *seed-defined* demonstration rows after checking they are referenced by zero user records; single transaction; exact `(company_name, country_code)` identity key; users, sessions, unlocks, saved buyers, outreach, scenarios, documents, and audit logs are never modified. Current state after seeding: **127 demonstration buyers**, 0 duplicates, integrity check `ok`.

The legacy `npm run seed` remains available for fresh databases only — it deletes and recreates demo tables.

## Theme

Light/dark toggle in both the marketing header and workspace topbar. Preference persists under `hl-theme` in localStorage with a pre-paint script (no flash); OS preference respected on first visit. Navy/blue design tokens (navy sidebar, white/pale-blue surfaces, blue + teal accents) are defined once as CSS variables in `src/app/globals.css` and mapped in `tailwind.config.ts`; charts, cards, forms, and navigation all adapt. Animations are 120–300 ms and disabled under `prefers-reduced-motion`.

## Known limitations

- **Demonstration dataset only.** Buyers, contacts, duties, FTA preferences, and incentive rates are seeded samples, labeled in-product. No live trade-data provider is connected.
- **No payments or subscriptions.** This is an academic project; all features are free. There is no checkout, credit top-up, plan upgrade, or payment provider anywhere in the product. The `credits` column on `users` is a legacy field kept only for schema backward compatibility and is never deducted, displayed as spendable, or enforced.
- **No external AI.** Ask Harborline is a rule-based router over internal APIs; no LLM vendor is configured.
- **No email sending.** "Draft intro email" produces a prefilled editable draft/mailto only; nothing is transmitted.
- **Password reset by email is not implemented** (change-password while signed in is).
- **Verification performed via source review, `tsc`, ESLint, production build, and direct SQL queries.** No browser automation is configured in this environment, so visual rendering and click-through behavior have not been machine-tested.

## Checks

```bash
npx tsc --noEmit    # type check — passes
npm run lint        # ESLint — passes
npm run build       # production build — passes
```
