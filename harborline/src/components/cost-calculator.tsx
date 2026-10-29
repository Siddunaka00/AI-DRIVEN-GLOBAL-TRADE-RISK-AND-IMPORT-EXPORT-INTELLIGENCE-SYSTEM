"use client";
// Landed-cost calculator. Server does the maths (POST /api/cost); this holds
// form state, syncs to the URL for shareability, and renders the itemised
// build-up as a stacked bar + ledger rows. Scenarios save to the DB.
import { useCallback, useEffect, useRef, useState } from "react";
import { api, useSession } from "./session";
import { Badge, EmptyState, Spinner, useToast } from "./ui";

const COUNTRIES = ["US", "GB", "AE", "CA", "AU", "DE", "NL", "JP", "SG", "ZA", "BJ", "TH"];
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function CostCalculator({ initialHs = "", compact = false }: { initialHs?: string; compact?: boolean }) {
  const toast = useToast();
  const { me } = useSession();
  const [f, setF] = useState({ hsCode: initialHs, country: "US", mode: "export", quantity: "5000", unitValueInr: "220", freight: "sea", insurancePct: "0.35" });
  const [res, setRes] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scenName, setScenName] = useState("");
  const [scens, setScens] = useState<any[]>([]);
  const t = useRef<any>();
  const set = (k: string) => (e: any) => setF(s => ({ ...s, [k]: e.target.value }));

  const calc = useCallback(async () => {
    setBusy(true); setErr(null);
    try {
      const d = await api("/api/cost", { method: "POST", body: JSON.stringify({ ...f, quantity: Number(f.quantity), unitValueInr: Number(f.unitValueInr), insurancePct: Number(f.insurancePct) }) });
      if (d.error) { setErr(d.error); setRes(null); } else setRes(d);
    } catch (e: any) { setErr(e.message); setRes(null); }
    finally { setBusy(false); }
  }, [f]);

  // live recompute on every edit — it's cheap and feels connected
  useEffect(() => { clearTimeout(t.current); t.current = setTimeout(calc, 400); return () => clearTimeout(t.current); }, [calc]);
  useEffect(() => { if (me) api("/api/scenarios").then(d => setScens(d.scenarios)).catch(() => {}); }, [me]);

  async function saveScenario() {
    if (!res) return;
    const name = scenName || `${f.hsCode} → ${f.country} ${f.mode}`;
    try { await api("/api/scenarios", { method: "POST", body: JSON.stringify({ name, payload: { f, res } }) }); setScens([{ id: Date.now(), name, payload: { f, res }, created_at: "just now" }, ...scens]); setScenName(""); toast({ kind: "ok", text: "Scenario saved to your workspace." }); }
    catch (e: any) { toast({ kind: "err", text: e.status === 401 ? "Sign in to save scenarios." : e.message }); }
  }

  return (
    <div className={compact ? "" : "mx-auto max-w-4xl px-4 py-8 sm:px-6"}>
      {!compact && <header className="mb-5"><h1 className="serif text-3xl">Landed cost</h1><p className="mt-1 text-sm text-muted">Ex-works → FOB → CIF with duty stack, FTA preference applied when one exists. Every line names its rate.</p></header>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
        <form className="card space-y-3 p-4" onSubmit={e => e.preventDefault()}>
          <div className="flex gap-2">
            {(["export", "import"] as const).map(m => (
              <button type="button" key={m} onClick={() => setF(s => ({ ...s, mode: m }))}
                className={`btn flex-1 ${f.mode === m ? "chip-on !border-copper text-copper" : ""}`}>{m === "export" ? "India → world (sell)" : "World → India (buy)"}</button>
            ))}
          </div>
          <label className="block text-xs text-muted">HS code<input required value={f.hsCode} onChange={set("hsCode")} placeholder="090921" className="input num mt-1 !py-2" /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">{f.mode === "export" ? "Destination" : "Origin"}<select value={f.country} onChange={set("country")} className="input mt-1 !py-2">{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></label>
            <label className="text-xs text-muted">Freight<select value={f.freight} onChange={set("freight")} className="input mt-1 !py-2"><option value="sea">Sea</option><option value="air">Air</option></select></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">Quantity<input type="number" min="1" value={f.quantity} onChange={set("quantity")} className="input num mt-1 !py-2" /></label>
            <label className="text-xs text-muted">Unit value ₹<input type="number" min="1" value={f.unitValueInr} onChange={set("unitValueInr")} className="input num mt-1 !py-2" /></label>
          </div>
          <label className="block text-xs text-muted">Insurance % of FOB<input value={f.insurancePct} onChange={set("insurancePct")} className="input num mt-1 !py-2" /></label>
          <p className="text-[11px] leading-relaxed text-faint">Seed model: inland ≈2% of ex-works · sea ≈6% / air ≈18% of FOB · import side applies BCD (+SWS 10%) then IGST per the HS row. Estimates, not customs advice.</p>
        </form>

        <div>
          {err && <EmptyState title="Can’t compute yet" hint={err} />}
          {busy && !res && <div className="card grid h-40 place-items-center"><Spinner /></div>}
          {res && (
            <div className="rise card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div><p className="num serif text-3xl text-copper">{inr(res.total)}</p><p className="text-xs text-muted">total landed · {inr(res.perUnit)} per unit · {res.hsDescription}</p></div>
                {res.agreement ? <Badge tone="ok">{res.agreement}</Badge> : <Badge tone="warn">MFN {res.mfnPct}%</Badge>}
              </div>
              {/* stacked bar */}
              <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full" role="img" aria-label="Cost composition">
                {res.lines.filter((l: any) => l.amount > 0 && !/^FOB|^CIF|^Assessable/.test(l.label)).slice(0, 6).map((l: any, i: number) => (
                  <div key={i} title={`${l.label}: ${inr(l.amount)}`} style={{ width: `${(l.amount / res.total) * 100}%`, background: ["#246bfd", "#5b8def", "#4c7a68", "#46608c", "#8a5a44", "#a8a29a"][i % 6], transition: "width 180ms ease-out" }} />
                ))}
              </div>
              <ul className="mt-4 divide-y divide-line text-sm">
                {res.lines.map((l: any, i: number) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 py-1.5">
                    <span>{l.label}{l.note && <span className="block text-[11px] text-faint">{l.note}</span>}</span>
                    <span className={`num shrink-0 ${/^(FOB|CIF|Assessable)/.test(l.label) ? "font-semibold text-ink/70" : ""}`}>{inr(l.amount)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-field bg-panel px-3 py-2 text-[12px] leading-relaxed text-muted">{res.currencyNote}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input value={scenName} onChange={e => setScenName(e.target.value)} placeholder="Scenario name…" aria-label="Scenario name" className="input !w-44 !py-1.5 text-[13px]" />
                <button onClick={saveScenario} className="btn-ghost">Save scenario</button>
                <button onClick={() => navigator.clipboard.writeText(JSON.stringify({ input: f, result: res }, null, 2)).then(() => toast({ kind: "ok", text: "Result copied — paste into your quote." }))} className="btn-quiet">Copy summary</button>
              </div>
            </div>
          )}
          {scens.length > 0 && (
            <div className="mt-4">
              <p className="label mb-1.5">Saved scenarios</p>
              <div className="flex flex-wrap gap-1.5">
                {scens.slice(0, 6).map(s => (
                  <button key={s.id} onClick={() => { setF(s.payload.f); toast({ kind: "info", text: `Loaded “${s.name}”.` }); }} className="chip hover:border-copper hover:text-copper">{s.name} · <span className="num">{inr(s.payload.res.total)}</span></button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
