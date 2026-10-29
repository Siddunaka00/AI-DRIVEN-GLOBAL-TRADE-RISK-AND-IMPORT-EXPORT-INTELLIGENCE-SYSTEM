import Link from "next/link";
import { db } from "@/lib/db";
import MarketingHeader, { MarketingFooter } from "@/components/marketing-header";
import HomeHero from "@/components/home-hero";

// Home — clean light hero + live stats from the seeded demonstration database.
export const metadata = { title: "AI-Powered Global Trade Intelligence" };

function GlobeMark() {
  // Simple lightweight SVG globe/network — no glow, no blobs.
  return (
    <svg viewBox="0 0 220 220" className="h-full w-full text-copper" fill="none" stroke="currentColor" aria-hidden strokeWidth="1.4">
      <circle cx="110" cy="110" r="86" />
      <ellipse cx="110" cy="110" rx="40" ry="86" />
      <ellipse cx="110" cy="110" rx="74" ry="86" opacity=".45" />
      <path d="M24 110h172M34 66h152M34 154h152" opacity=".6" />
      <circle cx="150" cy="70" r="4" fill="currentColor" stroke="none" />
      <circle cx="72" cy="132" r="4" fill="#19b89a" stroke="none" />
      <circle cx="132" cy="150" r="3" fill="#5B8DEF" stroke="none" />
      <path d="M150 70 72 132M72 132 132 150M132 150 150 70" opacity=".5" />
    </svg>
  );
}

export default function HomePage() {
  // Real counts from the local SQLite demo dataset — never hardcoded.
  const d = db();
  const buyers = (d.prepare("SELECT COUNT(*) c FROM buyers").get() as any).c;
  const countries = (d.prepare("SELECT COUNT(DISTINCT country_code) c FROM buyers").get() as any).c;
  const hs = (d.prepare("SELECT COUNT(*) c FROM hs_codes").get() as any).c;
  const docKinds = ["Proforma Invoice", "Commercial Invoice", "Packing List", "Quotation"]; // supported templates (see lib/docgen.ts)
  const docs = docKinds.length;

  const stats: [string, string][] = [
    [String(buyers), "Demonstration buyer records"],
    [String(countries), "Destination markets covered"],
    ["7", "Trade intelligence tools"],
    [String(docs), "Document templates"],
  ];

  const features: [string, string, string][] = [
    ["Find International Buyers", "Search by product, common name or HS code across a labeled demonstration directory.", "/buyers"],
    ["Trade Risk Assessment", "Explainable scores with each contributing factor listed in plain language.", "/app/buyers"],
    ["HS Code Lookup", "Classification, GST and duty context — plus what the code means for your shipment.", "/hs"],
    ["Landed Cost Calculator", "Ex-works → FOB → CIF build-ups with MFN vs FTA duty side by side.", "/cost"],
    ["FTA Checker", "Agreement coverage, preferential rates and certificate-of-origin steps.", "/fta"],
    ["Incentive Finder", "RoDTEP, drawback and RoSCTL sample rates with the claim path.", "/incentives"],
    ["Document Studio", "Proforma, invoice, packing list and quotation drafts that print to PDF.", "/documents"],
  ];

  return (
    <>
      <MarketingHeader />
      <main>
        {/* HERO — soft light-blue band, two columns */}
        <section className="hero-grid border-b border-line">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-20">
            <div>
              <p className="label mb-4 text-copper">AI-powered trade intelligence</p>
              <h1 className="max-w-xl text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-[1.12] tracking-tight">
                Discover Global Markets. <span className="text-copper">Make Smarter Trade Decisions.</span>
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
                TradeIQ brings international buyer discovery, explainable trade-risk assessment,
                HS code lookup and import-export decision support into one free academic platform.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/app" className="btn-primary !px-5 !py-2.5">Open Dashboard</Link>
                <Link href="/features" className="btn-ghost !px-5 !py-2.5">Explore Features</Link>
              </div>
              <HomeHero />
            </div>
            <div className="mx-auto hidden h-56 w-56 sm:block md:h-72 md:w-72" aria-hidden>
              <GlobeMark />
            </div>
          </div>
        </section>

        {/* STATS — compact real-count cards */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="Platform statistics">
          <div className="stagger mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map(([v, l]) => (
              <div key={l} className="card p-4">
                <p className="num text-2xl font-semibold text-copper">{v}</p>
                <p className="mt-1 text-xs leading-snug text-muted">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-label="Features">
          <h2 className="text-2xl font-semibold tracking-tight">Everything an SME needs before shipping</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">Seven connected tools reading the same records — search a buyer and the calculator, FTA checker and document studio all know who you are talking about.</p>
          <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(([t, b, href]) => (
              <Link key={t} href={href} className="card lift flex flex-col p-5">
                <h3 className="text-[15px] font-semibold">{t}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">{b}</p>
                <span className="mt-3 text-[13px] font-medium text-copper">Open tool →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* DASHBOARD PREVIEW */}
        <section className="border-y border-line bg-panel/60">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">A workspace that feels like a control room</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted">Command home with summary cards, quick actions and your real activity — unlocks, saved buyers, scenarios and documents.</p>
            <div className="card mt-8 overflow-hidden">
              <div className="flex items-stretch">
                <div className="hidden w-40 shrink-0 flex-col gap-1 bg-rail p-3 text-[11px] text-white/70 sm:flex" aria-hidden>
                  <p className="mb-2 font-semibold tracking-wide text-white">TradeIQ</p>
                  {["Dashboard","Find Buyers","Saved Buyers","HS Lookup","Landed Cost","FTA Checker","Documents"].map((x,i)=>(
                    <span key={x} className={`rounded px-2 py-1 ${i===0?"bg-copper text-white":"hover:bg-white/10"}`}>{x}</span>
                  ))}
                </div>
                <div className="min-w-0 flex-1 p-4 sm:p-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[["Buyer records", String(buyers)], ["Markets", String(countries)], ["HS codes", String(hs)], ["Tools", "7"]].map(([l,v])=>(
                      <div key={l} className="rounded-field border border-line bg-paper p-3">
                        <p className="text-[11px] uppercase tracking-wide text-muted">{l}</p>
                        <p className="num mt-1 text-xl font-semibold text-ink">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-field border border-line bg-paper p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted">Recent activity</p>
                    <p className="mt-2 text-[13px] text-ink">Unlocked <b>Marram Imports LLC</b> · New York, US · match 87/100</p>
                    <p className="mt-1 text-[13px] text-muted">Saved scenario “Basmati → UAE, sea” · landed ₹46.9/unit</p>
                    <p className="mt-1 text-[13px] text-faint italic">Preview only — sign in to see your own real activity.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/buyers?q=cumin" className="btn-primary">Try a live buyer search</Link>
              <Link href="/cost" className="btn-ghost">Open the cost calculator</Link>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <ol className="stagger mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["1 · Search", "Type a product, common name or HS code — “cumin”, “basmati rice UAE”, “0909”. The directory answers with scored matches."],
              ["2 · Decide", "Read the explainable match breakdown, duty position, FTA savings and incentives before you contact anyone."],
              ["3 · Document", "Unlock contacts free, save the buyer, and generate a prefilled proforma invoice that prints to PDF."],
            ].map(([t, b]) => (
              <li key={t} className="card p-5"><p className="font-semibold text-copper">{t}</p><p className="mt-2 text-[13px] leading-relaxed text-muted">{b}</p></li>
            ))}
          </ol>
        </section>

        {/* WHO IT'S FOR */}
        <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Exporters", "Find verified-style buyer records, price with real duty maths and ship with paperwork ready."],
              ["Importers", "Classify products, compute landed cost into India and compare MFN against FTA duty."],
              ["Students & researchers", "A working example of explainable AI applied to international trade — every score shows its reasons."],
            ].map(([t, b]) => (
              <div key={t} className="card p-5"><p className="font-semibold">{t}</p><p className="mt-2 text-[13px] leading-relaxed text-muted">{b}</p></div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Open the workspace.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Every feature is free — this is an academic demonstration project. No card, no credits, no subscription.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/register" className="btn-primary">Get started free</Link>
            <Link href="/login" className="btn-ghost">Use the demo login</Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
