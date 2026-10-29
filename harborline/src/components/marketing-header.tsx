import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { ThemeToggle, LoginLinks } from "@/components/chrome";
import { IconAnchor } from "@/components/icons";

// Full-bleed top bar shared by every marketing page. Server component.
// Academic build: no pricing, no credits — navigation points at features/tools.
export default function MarketingHeader() {
  const me = currentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-panel/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-copper"><IconAnchor className="h-5 w-5" /></span>
          <span className="text-[17px]">TradeIQ</span>
          <span className="label hidden sm:inline ml-1 -mb-0.5">AI · Trade intelligence</span>
        </Link>
        <nav className="ml-6 hidden items-center gap-5 text-sm text-muted lg:flex" aria-label="Marketing">
          <Link href="/" className="hover:text-ink transition-colors duration-fast">Home</Link>
          <Link href="/features" className="hover:text-ink transition-colors duration-fast">Features</Link>
          <Link href="/buyers" className="hover:text-ink transition-colors duration-fast">Find Buyers</Link>
          <Link href="/hs" className="hover:text-ink transition-colors duration-fast">Trade Tools</Link>
          <Link href="/about" className="hover:text-ink transition-colors duration-fast">About</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          {me ? (
            <Link href="/app" className="btn-primary !py-1.5 text-[13px]">Open Dashboard</Link>
          ) : (
            <LoginLinks />
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-semibold text-base">TradeIQ</p>
          <p className="mt-2 max-w-xs text-muted">AI-driven global trade risk and import-export intelligence system. A university major project for students of international trade.</p>
        </div>
        <div>
          <p className="label mb-2">Tools</p>
          <ul className="space-y-1.5 text-muted">
            <li><Link href="/buyers" className="hover:text-copper">Buyer directory</Link></li>
            <li><Link href="/hs" className="hover:text-copper">HS code lookup</Link></li>
            <li><Link href="/cost" className="hover:text-copper">Landed-cost calculator</Link></li>
            <li><Link href="/fta" className="hover:text-copper">FTA checker</Link></li>
            <li><Link href="/incentives" className="hover:text-copper">Incentive finder</Link></li>
          </ul>
        </div>
        <div>
          <p className="label mb-2">Project</p>
          <ul className="space-y-1.5 text-muted">
            <li><Link href="/features" className="hover:text-copper">Features</Link></li>
            <li><Link href="/about" className="hover:text-copper">About this project</Link></li>
            <li><Link href="/login" className="hover:text-copper">Log in</Link></li>
            <li><Link href="/register" className="hover:text-copper">Create account</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-faint">
        Academic demonstration project. Buyers, rates and contacts are seeded sample records, clearly labeled — verify against official notifications before any real shipment.
      </div>
    </footer>
  );
}
