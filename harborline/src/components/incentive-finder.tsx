"use client";
// Incentive finder — resolves an HS code to the schemes that stack on it
// (RoDTEP, drawback, exemptions). Rates come from the seeded DB table and are
// labeled as sample values everywhere they appear.
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "./session";
import { SkeletonRows, EmptyState, Badge } from "./ui";

export default function IncentiveFinder({ initialHs = "", compact = false }: any) {
  const [q, setQ] = useState(initialHs);
  const [res, setRes] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const code = q.replace(/\D/g, "");
    if (code.length < 4) { setRes(null); setErr(null); return; }
    setBusy(true); setErr(null);
    const t = setTimeout(() =>
      api(`/api/incentives?hs=${code}`).then(setRes)
        .catch(e => { setRes(null); setErr(e.message); })
        .finally(() => setBusy(false)), 300);
    return () => { clearTimeout(t); };
  }, [q]);
  return (
    <div className={compact ? "" : "mx-auto max-w-3xl px-4 py-8 sm:px-6"}>
      {!compact && <header className="mb-5"><h1 className="serif text-3xl">Export incentives</h1><p className="mt-1 text-sm text-muted">What gets paid back on this shipment — RoDTEP, duty drawback, exemptions. Enter an HS code (4+ digits) to resolve the stack.</p></header>}
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="HS code — e.g. 090921 or 610910" aria-label="HS code for incentives" className="input num !py-2.5" />
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {[["090921","cumin"],["610910","t-shirts"],["100630","basmati"]].map(([c,l]) => (
          <button key={c} onClick={() => setQ(c)} className="chip hover:border-copper hover:text-copper"><span className="num">{c}</span> {l}</button>
        ))}
      </div>
      {busy && <div className="mt-4"><SkeletonRows n={3} /></div>}
      {err && !busy && <div className="mt-4"><EmptyState title="No incentive data" hint={err} /></div>}
      {res && !busy && (
        <div className="rise mt-4 space-y-3">
          <p className="text-sm"><span className="num text-copper">{res.hs.code}</span> · {res.hs.description}</p>
          {res.schemes.map((s: any, i: number) => (
            <div key={s.scheme + i} className="lift card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{s.scheme}</p>
                <Badge tone={s.mode === "percent_of_fob" ? "ok" : "muted"}>{s.mode === "percent_of_fob" ? `${s.ratePct}% of FOB` : `${s.ratePct} ${s.mode}`}</Badge>
              </div>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px] leading-relaxed text-muted">
                {(s.steps ?? []).map((st: string, j: number) => <li key={j}>{st}</li>)}
              </ol>
            </div>
          ))}
          {res.apparelNote && <p className="rounded-field bg-panel px-3 py-2 text-xs text-muted">{res.apparelNote}</p>}
          <p className="rounded-field border border-warn/40 bg-warn/5 px-3 py-2 text-xs text-warn">{res.note}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href={`/cost?hs=${res.hs.code}`} className="btn-ghost !py-1.5 text-xs">Stack into landed cost</Link>
            <Link href={`/documents?hs=${res.hs.code}`} className="btn-ghost !py-1.5 text-xs">Prepare claim docs</Link>
          </div>
        </div>
      )}
      {!res && !err && !busy && <p className="mt-6 text-sm text-muted">Schemes only appear for codes in the tariff table — honest absence beats invented benefits.</p>}
    </div>
  );
}
