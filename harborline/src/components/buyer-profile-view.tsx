import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { buyerDetail, searchBuyers } from "@/lib/match";
import { findFta, lookupHs } from "@/lib/pricing";
import { Badge, Meter } from "@/components/ui";
import BuyerProfileActions from "@/components/buyer-actions";

// Shared full-page buyer profile body — used by /buyers/[id] (public) and
// /app/buyers/[id] (workspace). Same data path as GET /api/buyers/[id]:
// contacts masked unless this user holds an unlock row.
export default function BuyerProfileView({ id }: { id: number }) {
  const me = currentUser();
  const unlocked = !!me && !!db().prepare("SELECT 1 FROM unlocks WHERE user_id=? AND buyer_id=?").get(me.id, id);
  const d = buyerDetail(id, unlocked) as any;
  if (!d) notFound();
  const saved = !!me && !!db().prepare("SELECT 1 FROM saved_buyers WHERE user_id=? AND buyer_id=?").get(me.id, id);
  const unlockRow = db().prepare("SELECT unlocked_at FROM unlocks WHERE user_id=? AND buyer_id=?").get(me?.id ?? -1, id) as any;
  const scored = searchBuyers("", {}, "match").find((r: any) => r.id === id);
  const factors = scored?.factors ?? [];
  const hs = d.products[0]?.hs_code ? lookupHs(d.products[0].hs_code) : null;
  const fta = hs ? findFta(d.country_code, hs.code) : null;

  return (
    <div className="stagger space-y-5">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="serif text-3xl leading-tight">{d.flag} {d.company_name}</h1>
            {d.legal_name && d.legal_name !== d.company_name && <p className="mt-0.5 text-xs text-muted">Legal name: {d.legal_name}</p>}
            <p className="mt-1 text-sm text-muted">{d.city}, {d.country} · {d.company_type}{d.year_founded ? ` · est. ${d.year_founded}` : ""}{d.employee_band ? ` · ${d.employee_band}` : ""}</p>
          </div>
          <Badge tone={d.verification === "verified" ? "ok" : "warn"}>{d.verification}{d.verified_on ? ` · ${d.verified_on}` : ""}</Badge>
        </div>
        <BuyerProfileActions buyerId={id} buyerName={d.company_name} unlocked={unlocked} saved={saved}
          firstHs={d.products[0]?.hs_code ?? ""} loggedIn={!!me}/>
      </header>

      <section className="card p-4">
        <h2 className="label mb-2">Contacts {unlocked ? "" : "(masked)"}</h2>
        <ul className="divide-y divide-line text-sm">
          {d.contacts.map((c: any, i: number) => (
            <li key={i} className="flex items-center gap-2 py-2">
              <span className="chip capitalize">{c.kind}</span><span className="flex-1 truncate">{c.value}</span>
              {c.lastChecked && <span className="num text-[11px] text-faint">checked {c.lastChecked}</span>}
            </li>
          ))}
        </ul>
        {unlocked && d.address && <p className="mt-2 border-t border-line pt-2 text-xs text-muted">{d.address}</p>}
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <div className="card p-4">
          <h2 className="label mb-2">Products they buy</h2>
          <ul className="space-y-2 text-sm">
            {d.products.map((p: any) => (
              <li key={p.hs_code + p.product_name}>
                <Link href={`/hs/${p.hs_code}`} className="font-medium hover:text-copper">{p.product_name}</Link>{" "}
                <Link href={`/hs/${p.hs_code}`} className="num text-xs text-copper">HS {p.hs_code}</Link>
                {p.fit_note && <p className="text-[11px] text-muted">{p.fit_note}</p>}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="label mb-2">Trade posture</h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Order size</dt><dd>{d.order_size_band ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Incoterms</dt><dd>{d.incoterms ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Ports</dt><dd className="text-right">{(JSON.parse(d.ports || "[]")).join(", ") || "—"}</dd></div>
          </dl>
        </div>
      </section>

      {hs && (
        <section className="card p-4">
          <h2 className="label mb-2">Selling into {d.country} — duty position for {hs.code}</h2>
          <p className="text-sm">
            MFN reference <b className="num">{hs.bcd_pct}%</b>
            {fta && fta.preferential_pct >= 0
              ? <> → preferential <b className="num text-copper">{fta.preferential_pct}%</b> under {fta.agreement} (in force since {fta.in_force_since}). Certificate: {fta.coo_form}.</>
              : <> — no India FTA on file for this pair; buyer pays MFN.</>}
          </p>
          <p className="mt-1.5 text-[11px] text-faint">Licence note: {hs.licence_note || "none"} · Policy: {hs.policy}. Rates are seeded sample values — verify before quoting.</p>
        </section>
      )}

      {factors.length > 0 && (
        <section className="card p-4">
          <h2 className="label mb-3">Match breakdown</h2>
          <div className="space-y-3">
            {factors.map((f: any) => (
              <div key={f.key}>
                <div className="mb-1 flex justify-between text-xs"><span>{f.label}</span><span className="num text-muted">{f.points}/{f.max}</span></div>
                <Meter value={f.points} max={f.max} /><p className="mt-1 text-[11px] text-muted">{f.sentence}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="border-t border-line pt-3 text-[11px] text-faint">
        {unlockRow ? `Unlocked by you on ${String(unlockRow.unlocked_at).slice(0, 10)}. ` : ""}Source: TradeIQ verified directory. Not a scraped marketplace listing. Demonstration record.
      </p>
    </div>
  );
}
