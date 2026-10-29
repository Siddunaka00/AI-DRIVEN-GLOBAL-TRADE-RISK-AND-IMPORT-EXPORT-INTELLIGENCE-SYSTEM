import Link from "next/link";
import MarketingHeader, { MarketingFooter } from "@/components/marketing-header";

// Academic build: the old Pricing route now shows project capabilities.
// No tiers, no prices, no payments — everything here is free for demonstration.
export const metadata = { title: "Project Features" };

const FEATURES: [string, string, string, string][] = [
  ["AI trade risk assessment", "Explainable scores for products and destinations — every factor listed with its contribution and a plain-language reason.", "/app/buyers", "risk"],
  ["International buyer discovery", "Search 127 demonstration buyer records across 14 markets by product, common name or HS code, with match scoring you can read.", "/buyers", "users"],
  ["HS code lookup", "8-digit ITC-HS classification with description, GST and duty context, plus what the code means for your shipment.", "/hs", "tag"],
  ["Landed cost calculation", "Ex-works → FOB → CIF build-ups with duty, surcharge and IGST lines; MFN vs FTA side by side when an agreement exists.", "/cost", "calc"],
  ["FTA eligibility checking", "UAE CEPA, Australia ECTA and ASEAN coverage with preferential rates, certificate-of-origin steps and origin warnings.", "/fta", "doc"],
  ["Incentive discovery", "RoDTEP, duty-drawback and RoSCTL sample rates per export HS code with the four-step claim path.", "/incentives", "gift"],
  ["Trade document preparation", "Proforma invoices, commercial invoices, packing lists and quotations prefilled from your buyer record — print-ready.", "/documents", "print"],
  ["Trade intelligence dashboard", "A command home with real workspace activity: unlocks, saved buyers, scenarios, documents and audit history.", "/app", "grid"],
];

export default function FeaturesPage() {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="label mb-3 text-copper">What TradeIQ does</p>
        <h1 className="max-w-2xl text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-tight tracking-tight">
          Project features — all free, all working
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          This is an academic project developed to demonstrate AI-driven trade intelligence.
          All features are available free of charge for demonstration purposes. There are no
          subscriptions, no credits and no payments anywhere in this product.
        </p>
        <div className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([title, body, href]) => (
            <Link key={title} href={href} className="card lift rise flex flex-col p-5">
              <h2 className="text-[15px] font-semibold leading-snug">{title}</h2>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted">{body}</p>
              <span className="mt-3 text-[13px] font-medium text-copper">Open →</span>
            </Link>
          ))}
        </div>
        <div className="card mt-10 p-6 text-center">
          <h2 className="text-lg font-semibold">Try it on one login</h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">Sign up free, or use the seeded demo account — every tool works out of the box.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/register" className="btn-primary">Create free account</Link>
            <Link href="/login" className="btn-ghost">Demo login</Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
