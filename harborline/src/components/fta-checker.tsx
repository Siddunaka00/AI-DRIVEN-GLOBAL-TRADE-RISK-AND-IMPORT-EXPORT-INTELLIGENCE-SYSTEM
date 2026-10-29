"use client";
// FTA checker — pick destination + HS code, get the duty position and the
// paperwork chain. Honest about gaps: no agreement on file is stated plainly.
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "./session";
import { Badge, Spinner } from "./ui";

type Res = any;
const COUNTRIES: [string, string][] = [["US","United States"],["GB","United Kingdom"],["AE","UAE"],["CA","Canada"],["AU","Australia"],["DE","Germany"],["NL","Netherlands"],["JP","Japan"],["SG","Singapore"],["ZA","South Africa"],["BJ","Benin"],["TH","Thailand"]];

export default function FtaChecker({ initialHs = "", initialCc = "US", compact = false }: any) {
  const [hs, setHs] = useState(initialHs);
  const [cc, setCc] = useState(initialCc);
  const [res, setRes] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!/^\d{4,8}$/.test(hs)) { setRes(null); return; }
    setBusy(true); setErr(null);
    const t = setTimeout(() => api(`/api/fta?country=${cc}&hs=${hs}`).then(setRes).catch(e => setErr(e.message)).finally(() => setBusy(false)), 250);
    return () => clearTimeout(t);
  }, [hs, cc]);
  return (
    <div className={compact ? "" : "mx-auto max-w-3xl px-4 py-8 sm:px-6"}>
      {!compact && <header className="mb-5"><h1 className="serif text-3xl">FTA &amp; duty position</h1><p className="mt-1 text-sm text-muted">Which agreement applies to this product and market — or none — and what paperwork follows.</p></header>}
      <div className="card grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-xs text-muted">Destination<select value={cc} onChange={e => setCc(e.target.value)} className="input mt-1 !py-2">{COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="text-xs text-muted">HS code<input value={hs} onChange={e => setHs(e.target.value)} placeholder="090921" className="input num mt-1 !py-2" /></label>
        <div className="flex items-end"><span className="chip">India → {cc}</span></div>
      </div>
      {err && <p className="mt-4 text-sm text-bad">{err}</p>}
      {busy && <div className="mt-6 flex justify-center py-8"><Spinner className="h-6 w-6" /></div>}
      {res && !busy && (
        <div className="rise mt-4 space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm"><span className="num text-copper">{res.hs.code}</span> · {res.hs.description}</p>
              {res.agreement && !res.agreement.excluded ? <Badge tone="ok">{res.agreement.name}</Badge> : res.agreement?.excluded ? <Badge tone="warn">Excluded from {res.agreement.name}</Badge> : <Badge tone="warn">No India FTA on file</Badge>}
            </div>
            {/* MFN vs preferential comparison bar */}
            <div className="mt-5 space-y-2.5">
              <Bar label="MFN reference" pct={res.hs.bcd_pct} tone="#a8a29a" />
              {res.agreement && !res.agreement.excluded && res.agreement.preferentialPct >= 0 && <Bar label={`Preferential (${res.agreement.preferentialPct}%)`} pct={res.agreement.preferentialPct} tone="#246bfd" />}
            </div>
            {res.agreement && !res.agreement.excluded && res.agreement.preferentialPct >= 0
              ? <p className="mt-4 rounded-field bg-ok/10 px-3 py-2.5 text-sm text-ink">Duty drops from <b className="num">{res.agreement.mfnPct}%</b> to <b className="num">{res.agreement.preferentialPct}%</b> under {res.agreement.name}, in force since {res.agreement.inForceSince} — saving <b className="num">{res.agreement.savingPct}%</b> points. Rules of origin: {res.agreement.rooNote}</p>
              : res.agreement?.excluded
              ? <p className="mt-4 rounded-field bg-panel px-3 py-2.5 text-sm text-muted">{res.agreement.name} exists but this line is <b>excluded</b> from concessions — MFN {res.hs.bcd_pct}% applies. {res.agreement.rooNote}</p>
              : <p className="mt-4 rounded-field bg-panel px-3 py-2.5 text-sm text-muted">{res.message}</p>}
            {res.rooWarning && <p className="mt-3 border-l-2 border-warn pl-3 text-[13px] leading-relaxed text-muted">{res.rooWarning}</p>}
          </div>
          <div className="card p-5">
            <h2 className="label mb-3">Paperwork chain</h2>
            <ol className="space-y-2.5">
              {(res.cooSteps ?? []).map((s: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm"><span className="num shrink-0 grid h-6 w-6 place-items-center rounded-full bg-copper-soft text-[11px] font-semibold text-copper">{i + 1}</span><span>{s}</span></li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/cost?hs=${res.hs.code}`} className="btn-ghost">Land it in a cost scenario</Link>
              <Link href={`/incentives?hs=${res.hs.code}`} className="btn-ghost">Stack incentives on top</Link>
              <Link href={`/documents?hs=${res.hs.code}`} className="btn-primary">Draft the paperwork →</Link>
            </div>
            <p className="mt-4 border-t border-line pt-2 text-[11px] text-faint">Source: TradeIQ seed table (sample rates) · last reviewed {new Date().getFullYear()}. Not legal advice.</p>
          </div>
        </div>
      )}
      {!res && !busy && !err && <p className="mt-6 text-sm text-muted">Enter at least 4 digits of an HS code to check — e.g. <button className="chip num" onClick={() => setHs("090921")}>090921</button> <button className="chip num" onClick={() => setHs("610910")}>610910</button></p>}
    </div>
  );
}
function Bar({ label, pct, tone }: any) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-40 shrink-0 text-muted">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-panel">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct * 2)}%`, background: tone, transition: "width 220ms ease-out" }} />
      </div>
      <span className="num w-10 text-right font-semibold">{pct}%</span>
    </div>
  );
}
