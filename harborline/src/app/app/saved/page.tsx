import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, Badge } from "@/components/ui";

export const metadata = { title: "Saved & outreach" };

// Saved buyers + outreach list — server-rendered from the same tables the API
// uses. Contacts stay masked here unless individually unlocked (real rule:
// only rows in `unlocks` for this user reveal contacts on the profile page).
export default function SavedPage() {
  const user = currentUser();
  if (!user) redirect("/login?next=%2Fapp%2Fsaved");
  const d = db();

  const saved = d.prepare(`
    SELECT s.buyer_id AS id, s.saved_at, b.company_name, b.city, b.country_code, c.flag, c.name AS country,
      b.company_type, b.verification, b.verified_on,
      (SELECT group_concat(product_name, ' · ') FROM buyer_products p WHERE p.buyer_id=b.id) AS products,
      (SELECT 1 FROM unlocks u WHERE u.user_id=s.user_id AND u.buyer_id=s.buyer_id) AS unlocked
    FROM saved_buyers s JOIN buyers b ON b.id=s.buyer_id JOIN countries c ON c.code=b.country_code
    WHERE s.user_id=? ORDER BY s.saved_at DESC`).all(user.id) as any[];

  const outreach = d.prepare(`
    SELECT o.buyer_id AS id, o.status, o.added_at, b.company_name, b.city, c.flag, c.name AS country
    FROM outreach_list o JOIN buyers b ON b.id=o.buyer_id JOIN countries c ON c.code=b.country_code
    WHERE o.user_id=? ORDER BY o.added_at DESC`).all(user.id) as any[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="rise">
        <p className="label text-copper">Pipeline</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Saved &amp; outreach</h1>
        <p className="mt-1 text-sm text-muted">Everything you starred or queued for contact — persisted per account.</p>
      </header>

      <section className="mt-6">
        <h2 className="serif text-lg">Saved buyers <span className="num text-sm text-faint">({saved.length})</span></h2>
        {saved.length === 0 ? (
          <div className="card mt-3 p-6">
            <EmptyState title="Nothing saved yet"
              hint="Star a buyer in search results and they land here with their verification date."
              action={<Link href="/app/buyers" className="btn-primary">Find buyers</Link>} />
          </div>
        ) : (
          <ul className="stagger mt-3 grid gap-3 sm:grid-cols-2">
            {saved.map((b) => (
              <li key={b.id}>
                <Link href={`/app/buyers/${b.id}`} className="lift card block p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{b.flag} {b.company_name}</span>
                      <span className="block text-xs text-muted">{b.city}, {b.country} · {b.company_type}</span>
                    </span>
                    <Badge tone={b.unlocked ? "ok" : "muted"}>{b.unlocked ? "contacts unlocked" : "masked"}</Badge>
                  </div>
                  {b.products && <p className="mt-2 line-clamp-2 text-xs text-muted">{b.products}</p>}
                  <p className="num mt-2 text-[11px] text-faint">Saved {String(b.saved_at).slice(0, 10)} · verified {String(b.verified_on).slice(0, 10)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="serif text-lg">Outreach list <span className="num text-sm text-faint">({outreach.length})</span></h2>
        <p className="mt-1 text-xs text-muted">Queued for first contact. Draft emails are prepared locally in each buyer profile — nothing is sent automatically by TradeIQ.</p>
        {outreach.length === 0 ? (
          <div className="card mt-3 p-6"><EmptyState title="Outreach list is empty" hint="Use “Add to outreach” on an unlocked buyer profile." /></div>
        ) : (
          <ul className="card mt-3 divide-y divide-line overflow-hidden">
            {outreach.map((o) => (
              <li key={`${o.id}-${o.added_at}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link href={`/app/buyers/${o.id}`} className="min-w-0 truncate text-sm font-medium hover:text-copper">
                  {o.flag} {o.company_name}
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone={o.status === "contacted" ? "ok" : o.status === "replied" ? "copper" : "muted"}>{o.status}</Badge>
                  <span className="num text-[11px] text-faint">{String(o.added_at).slice(0, 10)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
