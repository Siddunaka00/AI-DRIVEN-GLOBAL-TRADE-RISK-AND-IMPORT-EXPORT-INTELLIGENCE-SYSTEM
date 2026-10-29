import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CountUp, EmptyState, Badge } from "@/components/ui";

export const metadata = { title: "Command home" };

// Command home — server-rendered from the user's real rows. No invented stats:
// every number here is a COUNT over this account's own unlocks/saves/docs.
export default function CommandHome() {
  const user = currentUser();
  if (!user) redirect("/login?next=%2Fapp");
  const d = db();

  const unlocks = d.prepare(
    `SELECT u.unlocked_at, b.id, b.company_name, b.city, b.country_code
     FROM unlocks u JOIN buyers b ON b.id=u.buyer_id
     WHERE u.user_id=? ORDER BY u.id DESC LIMIT 6`
  ).all(user.id) as any[];
  const savedCount = (d.prepare("SELECT COUNT(*) c FROM saved_buyers WHERE user_id=?").get(user.id) as any).c;
  const outreachCount = (d.prepare("SELECT COUNT(*) c FROM outreach_list WHERE user_id=?").get(user.id) as any).c;
  const scenarioCount = (d.prepare("SELECT COUNT(*) c FROM scenarios WHERE user_id=?").get(user.id) as any).c;
  const docs = d.prepare(
    "SELECT id, kind, title, created_at FROM documents WHERE user_id=? ORDER BY id DESC LIMIT 5"
  ).all(user.id) as any[];
  const recent = d.prepare(
    "SELECT action, detail, created_at FROM audit_log WHERE user_id=? ORDER BY id DESC LIMIT 8"
  ).all(user.id) as any[];

  const unlocksTotal = (d.prepare("SELECT COUNT(*) c FROM unlocks WHERE user_id=?").get(user.id) as any).c;
  const directoryCount = (d.prepare("SELECT COUNT(*) c FROM buyers").get() as any).c;
  const firstName = user.full_name.split(" ")[0] || user.full_name;

  const QUICK: [string, string, string][] = [
    ["/app/buyers", "Find buyers", "Search the demonstration directory"],
    ["/app/hs", "Check HS code", "Duty, policy, licence in one view"],
    ["/app/cost", "Landed cost", "Ex-works → CIF build-up"],
    ["/app/fta", "FTA eligibility", "Preferential duty vs MFN"],
    ["/app/incentives", "Incentives", "RoDTEP / drawback rates"],
    ["/app/documents", "Trade document", "Invoice, packing list, COO"],
    ["/app/ask", "Ask TradeIQ", "A brief built from live data"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <header className="rise">
        <p className="label text-copper">Command home</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Good day, {firstName}.</h1>
        <p className="mt-1 text-sm text-muted">
          Your desk at {user.company || "TradeIQ"} · every feature is free in this academic build
        </p>
      </header>

      {/* summary cards */}
      <section aria-label="Account summary" className="stagger mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/app/buyers" className="lift card p-4">
          <p className="label">Buyer records</p>
          <p className="num mt-1 text-3xl font-semibold text-copper"><CountUp to={directoryCount} /></p>
          <p className="mt-1 text-xs text-muted">Demonstration directory — free unlocks</p>
        </Link>
        <div className="lift card p-4">
          <p className="label">Buyers unlocked</p>
          <p className="num mt-1 text-3xl font-semibold"><CountUp to={unlocksTotal} /></p>
        </div>
        <Link href="/app/saved" className="lift card p-4">
          <p className="label">Saved &amp; outreach</p>
          <p className="num mt-1 text-3xl font-semibold"><CountUp to={savedCount} /></p>
          <p className="mt-1 text-xs text-muted">{outreachCount} in outreach list</p>
        </Link>
        <Link href="/app/costs" className="lift card p-4">
          <p className="label">Cost scenarios</p>
          <p className="num mt-1 text-3xl font-semibold"><CountUp to={scenarioCount} /></p>
          <p className="mt-1 text-xs text-muted">{docs.length} document{docs.length === 1 ? "" : "s"} drafted</p>
        </Link>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8 min-w-0">
          {/* quick actions */}
          <section>
            <h2 className="serif text-lg">Quick actions</h2>
            <div className="stagger mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {QUICK.map(([href, title, hint]) => (
                <Link key={href} href={href} className="lift card flex items-start gap-3 p-3.5">
                  <span aria-hidden className="mt-0.5 text-copper">›</span>
                  <span><span className="block text-sm font-medium">{title}</span>
                    <span className="block text-xs text-muted">{hint}</span></span>
                </Link>
              ))}
            </div>
          </section>

          {/* recent unlocks */}
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="serif text-lg">Recent unlocks</h2>
              <Link href="/app/buyers" className="btn-quiet text-xs">Find more buyers →</Link>
            </div>
            {unlocks.length === 0 ? (
              <div className="card mt-3 p-6">
                <EmptyState title="No buyers unlocked yet"
                  hint="Search the directory by product, common name or HS code. Names and products are always free — unlocking reveals direct contacts."
                  action={<Link href="/app/buyers" className="btn-primary">Search buyers</Link>} />
              </div>
            ) : (
              <ul className="card mt-3 divide-y divide-line overflow-hidden">
                {unlocks.map((u) => (
                  <li key={`${u.id}-${u.unlocked_at}`} className="flex items-center justify-between gap-3 px-4 py-3">
                    <Link href={`/app/buyers/${u.id}`} className="min-w-0">
                      <span className="block truncate text-sm font-medium hover:text-copper">{u.company_name}</span>
                      <span className="block truncate text-xs text-muted">{u.city}, {u.country_code}</span>
                    </Link>
                    <span className="num shrink-0 text-xs text-faint">{String(u.unlocked_at).slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* recent documents */}
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="serif text-lg">Recent documents</h2>
              <Link href="/app/documents" className="btn-quiet text-xs">Document studio →</Link>
            </div>
            {docs.length === 0 ? (
              <div className="card mt-3 p-6">
                <EmptyState title="Nothing drafted yet"
                  hint="Generate a proforma invoice straight from a buyer profile — buyer name, address and product lines come pre-filled." />
              </div>
            ) : (
              <ul className="card mt-3 divide-y divide-line overflow-hidden">
                {docs.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <Link href={`/app/documents?id=${doc.id}`} className="min-w-0">
                      <span className="block truncate text-sm font-medium hover:text-copper">{doc.title}</span>
                      <span className="block text-xs capitalize text-muted">{doc.kind.replace("_", " ")}</span>
                    </Link>
                    <span className="num shrink-0 text-xs text-faint">{String(doc.created_at).slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* activity rail */}
        <aside>
          <h2 className="serif text-lg">Your activity</h2>
          <p className="mt-1 text-xs text-muted">Real audit records — what your account did, newest first.</p>
          {recent.length === 0 ? (
            <div className="card mt-3 p-5"><EmptyState title="No activity yet" hint="Actions you take will appear here." /></div>
          ) : (
            <ol className="card mt-3 divide-y divide-line overflow-hidden">
              {recent.map((r) => (
                <li key={r.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Badge tone="muted">{r.action.replace(/_/g, " ")}</Badge>
                    <span className="num text-[11px] text-faint">{String(r.created_at).slice(0, 16).replace("T", " ")}</span>
                  </div>
                  {r.detail && <p className="mt-1 truncate text-xs text-muted">{r.detail}</p>}
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}
