import Link from "next/link";
import MarketingHeader, { MarketingFooter } from "@/components/marketing-header";

export const metadata = { title: "About this project" };

export default function AboutPage() {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="label mb-3 text-copper">University major project</p>
        <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
          AI-Driven Global Trade Risk and Import-Export Intelligence System
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
          <p><b className="text-ink">TradeIQ</b> is an academic web application that demonstrates how explainable AI can help small exporters and importers make better international-trade decisions: discovering overseas buyers, assessing trade risk, classifying products under HS codes, computing landed costs, checking Free Trade Agreement eligibility, finding government incentives and preparing shipping documents — in one place.</p>
          <p>The system deliberately avoids black-box outputs. Every score decomposes into labeled factors with a sentence explaining each one; every duty figure names the table it came from. Buyer records, tariffs and incentive rates in this build are clearly labeled <b className="text-ink">demonstration data</b>, not live verified sources.</p>
          <p>There is no monetization of any kind: no pricing tiers, no credits, no payment gateway. Contact unlocking is free; unlock events are still recorded so activity history remains accurate.</p>
        </div>
        <div className="card mt-8 p-6">
          <h2 className="text-base font-semibold">Stack</h2>
          <ul className="mt-3 grid gap-1.5 text-sm text-muted sm:grid-cols-2">
            <li>Next.js 14 App Router · TypeScript</li>
            <li>Tailwind CSS, navy/blue design tokens</li>
            <li>SQLite via better-sqlite3 (no server needed)</li>
            <li>Session auth with bcrypt-hashed passwords</li>
            <li>Data-driven “Ask TradeIQ” brief router</li>
            <li>Print-ready HTML trade documents</li>
          </ul>
          <Link href="/features" className="btn-primary mt-5">See the feature list</Link>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
