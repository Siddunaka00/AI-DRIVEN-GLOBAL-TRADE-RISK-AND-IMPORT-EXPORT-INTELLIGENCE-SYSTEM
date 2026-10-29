"use client";
// HS lookup: search by code or plain-language product name; results carry the
// duty stack, policy and who-buys-this linkage. URL-synced so codes are shareable.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "./session";
import { SkeletonRows, EmptyState, CopyBtn, useToast } from "./ui";

export interface HsRow {
  code: string; description: string; category: string; unit: string; bcd_pct: number; gst_pct: number;
  policy: string; licence_note: string | null;
}

export default function HsLookup({ initialCode = "", compact = false }: { initialCode?: string; compact?: boolean }) {
  const [q, setQ] = useState(initialCode);
  const [rows, setRows] = useState<HsRow[] | null>(null);
  const [sel, setSel] = useState<HsRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const t = useRef<any>();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => { try { setRecent(JSON.parse(localStorage.getItem("hl-hs-recent") ?? "[]")); } catch {} }, []);
  function remember(code: string) {
    const r = [code, ...recent.filter(x => x !== code)].slice(0, 6);
    setRecent(r); try { localStorage.setItem("hl-hs-recent", JSON.stringify(r)); } catch {}
  }

  useEffect(() => {
    clearTimeout(t.current);
    if (!q.trim()) { setRows(null); setSel(null); return; }
    t.current = setTimeout(async () => {
      setBusy(true);
      try {
        const d = await api(`/api/hs/search?q=${encodeURIComponent(q.trim())}`);
        setRows(d.results);
        if (d.results[0]) setSel(d.results[0]);
        else if (compact && /^\d{4,8}$/.test(q.trim())) { const d2 = await api(`/api/hs/search?q=${q.trim()}`); setRows(d2.results); }
      } finally { setBusy(false); }
    }, 250);
    return () => clearTimeout(t.current);
  }, [q, compact]);

  // deep link support: /hs/0909 → preselect after first fetch
  useEffect(() => { if (initialCode && rows?.length) { const m = rows.find(r => r.code === initialCode) ?? rows[0]; setSel(m); } }, [initialCode, rows]);

  return (
    <div className={compact ? "" : "mx-auto max-w-3xl px-4 py-8 sm:px-6"}>
      {!compact && (
        <header className="mb-5">
          <h1 className="serif text-3xl">HS classification</h1>
          <p className="mt-1 text-sm text-muted">Type a code (try <span className="num">0909</span>) or what you actually call it — &ldquo;basmati&rdquo;, &ldquo;t-shirts&rdquo;. Rates shown are seeded sample values with plain-language notes.</p>
        </header>
      )}
      <input value={q} onChange={e => { setQ(e.target.value); if (compact) router.replace(`/app/hs?code=${e.target.value}`); }} placeholder="0909 · cumin · cotton t-shirts" aria-label="Search HS codes"
        className="input !py-2.5" autoComplete="off" />
      {recent.length > 0 && !compact && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <span className="label">Recent</span>
          {recent.map(c => <button key={c} onClick={() => setQ(c)} className="chip num hover:border-copper hover:text-copper">{c}</button>)}
        </div>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,340px)_1fr]">
        {/* result list */}
        <div>
          {busy && <SkeletonRows n={4} />}
          {!busy && rows === null && <EmptyState title="Search the tariff book" hint="Six-digit ITC-HS codes, descriptions and common names are all searchable." />}
          {!busy && rows && rows.length === 0 && <EmptyState title={`Nothing for “${q}”`} hint="Try a broader word (‘rice’, ‘oil’) or the first four digits of the code." />}
          {!busy && rows?.map(r => (
            <button key={r.code} onClick={() => { setSel(r); remember(r.code); if (compact) router.replace(`/app/hs?code=${r.code}`); }}
              className={`lift card mb-2 block w-full px-3.5 py-2.5 text-left transition-colors duration-fast ${sel?.code === r.code ? "!border-copper ring-1 ring-copper/30" : ""}`}>
              <p className="num text-sm font-semibold text-copper">{r.code}</p>
              <p className="line-clamp-2 text-[13px] leading-snug">{r.description}</p>
              <p className="num mt-1 text-[11px] text-muted">BCD {r.bcd_pct}% · GST {r.gst_pct}% · {r.policy}</p>
            </button>
          ))}
        </div>
        {/* detail */}
        <div>
          {sel ? (
            <div className="card rise p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="num serif text-2xl text-copper">{sel.code}</p><p className="text-xs uppercase tracking-wide text-muted">{sel.category} · unit: {sel.unit}</p></div>
                <CopyBtn value={sel.code} label="HS code" />
              </div>
              <p className="mt-3 text-sm leading-relaxed">{sel.description}</p>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[["BCD", `${sel.bcd_pct}%`], ["IGST", `${sel.gst_pct}%`], ["Policy", sel.policy]].map(([k, v]) => (
                  <div key={k as string} className="rounded-field bg-panel px-2 py-2.5"><dt className="label text-faint">{k}</dt><dd className="num mt-0.5 text-sm font-semibold">{v}</dd></div>
                ))}
              </dl>
              {sel.licence_note && <p className="mt-2 border-l-2 border-warn pl-3 text-[13px] leading-relaxed text-muted"><b className="text-warn">Licence:</b> {sel.licence_note}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/cost?hs=${sel.code}`} className="btn-ghost">Landed cost with this code</Link>
                <Link href={`/fta?hs=${sel.code}`} className="btn-ghost">FTA position</Link>
                <Link href={`/incentives?hs=${sel.code}`} className="btn-ghost">Incentives</Link>
                <Link href={`/buyers?q=${encodeURIComponent(sel.code)}`} className="btn-primary">Buyers for this code →</Link>
              </div>
              <p className="mt-4 border-t border-line pt-2 text-[11px] text-faint">Sample rates for demonstration. Verify against current CBIC notifications before filing.</p>
            </div>
          ) : (
            <EmptyState title="Pick a classification" hint="The right panel shows duty, tax, licensing and who in the directory buys this code." />
          )}
        </div>
      </div>
    </div>
  );
}
