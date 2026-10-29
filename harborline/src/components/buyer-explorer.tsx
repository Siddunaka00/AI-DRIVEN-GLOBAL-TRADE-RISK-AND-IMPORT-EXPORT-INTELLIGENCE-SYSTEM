"use client";
// The core of TradeIQ: buyer split view. Left = scrollable result column,
// right = selected buyer profile panel (full-screen sheet on mobile). All
// state lives in the URL (?q=&country=…) so back/forward and refresh work.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/components/session";
import { SkeletonRows, EmptyState, Badge, Meter, useToast, ConfirmDialog } from "@/components/ui";
import { IconBookmark, IconSearch, IconX, IconChevron, IconArrowLeft } from "@/components/icons";

export interface ScoredBuyer {
  id: number; company_name: string; city: string; country: string; flag: string; country_code: string;
  company_type: string; verification: string; verified_on: string | null;
  products: { hs_code: string; product_name: string; fit_note: string | null }[];
  contactCount: number; emailMasked: string | null; phoneMasked: string | null;
  matchScore: number; matchSentence: string;
  factors: { key: string; label: string; points: number; max: number; sentence: string }[];
}

const COUNTRIES = ["", "US", "GB", "AE", "CA", "AU", "DE", "NL", "JP", "SG", "ZA", "BJ", "TH"];
const TYPES = ["", "importer", "distributor", "retailer", "manufacturer"];
const CATS: [string, string][] = [["", "All categories"], ["spices", "Spices"], ["rice", "Rice"], ["textiles", "Textiles"], ["apparel", "Apparel"], ["pharma", "Pharma"], ["oils", "Essential oils"], ["vegetables", "Dehydrated veg"], ["engineering", "Engineering goods"]];

export default function BuyerExplorer({ initialQ = "", workspace = false }: { initialQ?: string; workspace?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const base = workspace ? "/app" : "";
  const [q, setQ] = useState(initialQ);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState("match");
  const [rows, setRows] = useState<ScoredBuyer[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [confirmUnlock, setConfirmUnlock] = useState<ScoredBuyer | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [mobileSheet, setMobileSheet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<any>();

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v);
    if (sort !== "match") p.set("sort", sort);
    return p.toString();
  }, [q, filters, sort]);

  const run = useCallback(async (query: string, keepSel = true) => {
    setRows(null); setErr(null);
    try {
      const d = await api(`/api/buyers/search?${query}`);
      setRows(d.results as ScoredBuyer[]);
      // preserve selection when practical; else select top result
      setSel(s => (keepSel && s && d.results.some((r: ScoredBuyer) => r.id === s)) ? s : d.results[0]?.id ?? null);
    } catch (e: any) { setErr(e.message); setRows([]); }
  }, []);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      run(qs);
      const url = qs ? `${base}/buyers?${qs}` : `${base}/buyers`;
      window.history.replaceState(null, "", url);
    }, 260);
    return () => clearTimeout(debounce.current);
  }, [qs, run, base]);

  useEffect(() => {
    if (sel == null) { setDetail(null); return; }
    setDetailBusy(true);
    api(`/api/buyers/${sel}`).then(setDetail).catch(e => { setDetail(null); toast({ kind: "err", text: e.message }); }).finally(() => setDetailBusy(false));
  }, [sel, toast]);

  const row = rows?.find(r => r.id === sel) ?? null;

  async function toggleSave(b: ScoredBuyer) {
    try {
      const d = await api(`/api/buyers/${b.id}/save`, { method: "POST", body: "{}" });
      setSavedIds(s => { const n = new Set(s); d.saved ? n.add(b.id) : n.delete(b.id); return n; });
      toast({ kind: "ok", text: d.saved ? `Saved ${b.company_name}.` : `Removed ${b.company_name} from saved.` });
    } catch (e: any) {
      if (e.status === 401) toast({ kind: "info", text: "Sign in to save buyers." }), router.push(`/login?next=${encodeURIComponent(workspace ? `/app/buyers?${qs}` : `/buyers?${qs}`)}`);
      else toast({ kind: "err", text: e.message });
    }
  }

  async function doUnlock() {
    if (!confirmUnlock) return;
    setUnlockBusy(true);
    try {
      const d = await api(`/api/buyers/${confirmUnlock.id}/unlock`, { method: "POST" });
      toast({ kind: "ok", text: d.alreadyUnlocked ? "Already unlocked." : `Unlocked ${confirmUnlock.company_name} — contacts are free in this build.` });
      setConfirmUnlock(null);
      setDetail(await api(`/api/buyers/${confirmUnlock.id}`));
      router.refresh();
    } catch (e: any) {
      if (e.status === 401) { setConfirmUnlock(null); toast({ kind: "info", text: "Sign in to unlock contacts." }); router.push(`/login?next=${encodeURIComponent("/app/buyers")}`); }
      else { setConfirmUnlock(null); toast({ kind: "err", text: e.message ?? "Could not unlock — please retry." }); }
    } finally { setUnlockBusy(false); }
  }

  return (
    <div className="flex h-[calc(100dvh-3.25rem)] flex-col lg:flex-row">
      {/* ---- LEFT: results column ---- */}
      <section className={`flex w-full flex-col border-line lg:w-[420px] lg:min-w-[380px] lg:border-r ${mobileSheet ? "hidden lg:flex" : ""}`} aria-label="Buyer results">
        <div className="border-b border-line px-3 py-3">
          <form onSubmit={e => e.preventDefault()} className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"><IconSearch className="h-4 w-4" /></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="cumin · basmati rice · 0909 · cotton t-shirts USA"
              aria-label="Search buyers" className="input !py-2 pl-9" autoComplete="off" />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"><IconX className="h-3.5 w-3.5" /></button>}
          </form>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <button onClick={() => setShowFilters(v => !v)} className={`chip ${Object.values(filters).some(Boolean) ? "chip-on" : ""}`}>
              Filters{Object.values(filters).filter(Boolean).length ? ` · ${Object.values(filters).filter(Boolean).length}` : ""}
            </button>
            <label className="ml-auto flex items-center gap-1.5 text-muted">Sort
              <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-field border border-line bg-panel px-1.5 py-1 text-xs" aria-label="Sort results">
                <option value="match">Match score</option><option value="recent">Recently verified</option><option value="complete">Most complete contact</option>
              </select>
            </label>
          </div>
          {showFilters && (
            <div className="pop-in mt-2 grid grid-cols-2 gap-2 rounded-card border border-line bg-paper p-2.5">
              <label className="text-xs text-muted">Country<select className="input !py-1.5 mt-0.5 text-xs" value={filters.country ?? ""} onChange={e => setFilters(f => ({ ...f, country: e.target.value }))}>{COUNTRIES.map(c => <option key={c} value={c}>{c || "Any"}</option>)}</select></label>
              <label className="text-xs text-muted">Company type<select className="input !py-1.5 mt-0.5 text-xs" value={filters.type ?? ""} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>{TYPES.map(t => <option key={t} value={t}>{t || "Any"}</option>)}</select></label>
              <label className="text-xs text-muted">Category<select className="input !py-1.5 mt-0.5 text-xs" value={filters.category ?? ""} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>{CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <div className="flex flex-col justify-end gap-1 text-xs text-muted">
                {[["verified", "Verified only"], ["hasEmail", "Has email"], ["hasPhone", "Has phone"], ["hasLinkedIn", "Has LinkedIn"]].map(([k, l]) => (
                  <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={!!filters[k]} onChange={e => setFilters(f => ({ ...f, [k]: e.target.checked ? "1" : "" }))} className="accent-[#246bfd]" />{l}</label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
          {err && <EmptyState title="Search failed" hint={err} action={<button className="btn-ghost" onClick={() => run(qs)}>Retry</button>} />}
          {!err && rows === null && <SkeletonRows n={6} />}
          {!err && rows && rows.length === 0 && (
            <EmptyState title="No directory matches"
              hint={q ? `Nothing found for “${q}” with these filters. Try a broader word (“spices”), a 4-digit HS prefix (“0909”), or clear a filter.` : "The seeded world covers spices, rice, textiles, pharma, oils, dehydrated vegetables and engineering goods across 12 countries."}
              action={<button className="btn-ghost" onClick={() => { setQ(""); setFilters({}); }}>Reset search</button>} />
          )}
          {rows?.map((b, i) => (
            <button key={b.id} onClick={() => { setSel(b.id); setMobileSheet(true); }}
              style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
              className={`rise lift card mb-2 block w-full px-3.5 py-3 text-left transition-colors duration-fast ${sel === b.id ? "!border-copper ring-1 ring-copper/30" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-snug">{b.flag} {b.company_name}</p>
                <span className="num shrink-0 text-sm font-semibold text-copper">{b.matchScore}<span className="text-[10px] text-faint">/100</span></span>
              </div>
              <p className="mt-0.5 text-xs text-muted">{b.city}, {b.country} · {b.company_type}{b.verification === "verified" ? " · verified" : ""}{b.verified_on ? ` (${b.verified_on})` : ""}</p>
              <p className="mt-1.5 line-clamp-1 text-xs text-ink/80">{b.products.map(p => p.product_name).join(" · ")}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{b.matchSentence}</p>
              <div className="mt-2 flex items-center gap-2">
                <Meter value={b.matchScore} />
                <span className="num shrink-0 text-[11px] text-faint">{b.emailMasked ?? "no email"} · {b.contactCount} of {b.contactCount + (b.verification === "unverified" ? 1 : 0)} contacts</span>
              </div>
            </button>
          ))}
          {rows && rows.length > 0 && <p className="num py-3 text-center text-[11px] text-faint">{rows.length} result{rows.length === 1 ? "" : "s"} · demonstration directory</p>}
        </div>
      </section>

      {/* ---- RIGHT: profile panel / mobile sheet ---- */}
      <section className={`relative min-h-0 flex-1 overflow-y-auto bg-paper ${mobileSheet ? "" : "hidden lg:block"}`} aria-label="Buyer profile" aria-live="polite">
        {mobileSheet && (
          <button onClick={() => setMobileSheet(false)} className="btn sticky top-2 z-10 -ml-1 !bg-paper/90 backdrop-blur !px-2 text-sm md:hidden"><IconArrowLeft className="h-4 w-4" /> Back to results</button>
        )}
        {row === null && !detailBusy && (
          <div className="grid h-full place-items-center p-6"><EmptyState title="Select a buyer" hint="Pick a result on the left to see the full profile, compliance snapshot and match breakdown here." /></div>
        )}
        {(detailBusy || row) && (
          <div className="sheet-up mx-auto max-w-2xl px-4 py-6 sm:px-8">
            {row && <ProfilePanel row={row} detail={detail} busy={detailBusy} saved={savedIds.has(row.id)}
              onSave={() => toggleSave(row)} onUnlock={() => setConfirmUnlock(row)} base={base} />}
          </div>
        )}
      </section>

      <ConfirmDialog open={!!confirmUnlock} title={`Unlock ${confirmUnlock?.company_name}?`} busy={unlockBusy}
        confirmLabel="Unlock contacts"
        body={<>Reveals direct contacts for this demonstration record. Free in this academic build; the action is written to your activity history.</>}
        onConfirm={doUnlock} onClose={() => setConfirmUnlock(null)} />
    </div>
  );
}

/* ---------- profile panel ---------- */
function ProfilePanel({ row, detail, busy, saved, onSave, onUnlock, base }: any) {
  const toast = useToast();
  const unlocked = !!detail?.unlocked;
  if (busy && !detail) return (<div className="space-y-3"><div className="skel h-8 w-2/3" /><div className="skel h-4 w-1/2" /><div className="skel h-40 w-full rounded-card" /></div>);
  const d = detail;
  return (
    <div className="stagger space-y-5">
      {/* header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="serif text-2xl leading-tight">{row.flag} {row.company_name}</h2>
            {d && d.legal_name && d.legal_name !== d.company_name && <p className="mt-0.5 text-xs text-muted">Legal name: {d.legal_name}</p>}
            <p className="mt-1 text-sm text-muted">{row.city}, {row.country} · {row.company_type}{d?.year_founded ? ` · est. ${d.year_founded}` : ""}{d?.employee_band ? ` · ${d.employee_band}` : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={row.verification === "verified" ? "ok" : "warn"}>{row.verification}{row.verified_on ? ` · ${row.verified_on}` : ""}</Badge>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onSave} className={saved ? "btn chip-on !border-copper text-copper" : "btn-ghost"}>
            <IconBookmark className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save buyer"}
          </button>
          {!unlocked
            ? <button onClick={onUnlock} className="btn-primary">Unlock contacts</button>
            : <>
                <Link href={`${base}/documents?buyer=${row.id}&hs=${row.products?.[0]?.hs_code ?? ""}`} className="btn-ghost">Generate proforma</Link>
                <DraftEmailBtn buyer={d} product={row.products?.[0]?.product_name} />
                <AddOutreachBtn id={row.id} name={row.company_name} />
              </>}
          <Link href={`/buyers/${row.id}`} className="btn-quiet">Full page →</Link>
        </div>
      </div>

      {/* match breakdown */}
      <div className="card p-4">
        <div className="flex items-baseline justify-between"><h3 className="label">Match breakdown</h3><span className="num serif text-lg text-copper">{row.matchScore}/100</span></div>
        <div className="mt-3 space-y-3">
          {row.factors.map((f: any) => (
            <div key={f.key}>
              <div className="mb-1 flex justify-between text-xs"><span className="font-medium">{f.label}</span><span className="num text-muted">{f.points}/{f.max}</span></div>
              <Meter value={f.points} max={f.max} />
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{f.sentence}</p>
            </div>
          ))}
        </div>
      </div>

      {/* contacts */}
      <div className="card p-4">
        <div className="flex items-center justify-between"><h3 className="label">Contacts</h3><span className="text-[11px] text-faint">{d?.realContactCount ?? row.contactCount} on file</span></div>
        <ul className="mt-2 divide-y divide-line text-sm">
          {(d?.contacts ?? []).map((c: any, i: number) => (
            <li key={i} className="flex items-center gap-2 py-2">
              <span className="chip !py-0 capitalize">{c.kind}</span>
              <span className={`flex-1 truncate ${unlocked ? "" : "text-muted"}`}>{c.value}</span>
              {unlocked && c.value && !String(c.value).startsWith("•") && <CopyInline value={c.value} />}
              {c.lastChecked && <span className="num hidden text-[11px] text-faint sm:inline">checked {c.lastChecked}</span>}
            </li>
          ))}
          {!d?.contacts?.length && <li className="py-2 text-sm text-muted">No contact channels recorded.</li>}
        </ul>
        {!unlocked && (
          <p className="mt-2 flex items-center gap-1.5 rounded-field bg-copper-soft px-3 py-2 text-xs text-copper">
            <IconChevron className="h-3 w-3" /> Contacts are masked until unlock. Company name and products stay free — we hide nothing that identifies who they are.
          </p>
        )}
        {unlocked && d?.address && <p className="mt-2 border-t border-line pt-2 text-xs text-muted">{d.address}</p>}
      </div>

      {/* products + trade posture */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="card p-4">
          <h3 className="label mb-2">Products they buy</h3>
          <ul className="space-y-2.5 text-sm">
            {row.products.map((p: any) => (
              <li key={p.hs_code + p.product_name}>
                <Link href={`/hs/${p.hs_code}`} className="font-medium text-ink hover:text-copper">{p.product_name}</Link>{" "}
                <Link href={`/hs/${p.hs_code}`} className="num text-xs text-copper">HS {p.hs_code}</Link>
                {p.fit_note && <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{p.fit_note}</p>}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h3 className="label mb-2">Trade posture</h3>
          <dl className="space-y-1.5 text-sm">
            {d && (<><Row k="Typical order size" v={d.order_size_band} /><Row k="Usual Incoterms" v={d.incoterms} /><Row k="Receives at" v={(JSON.parse(d.ports || "[]")).join(", ")} /></>)}
            {!d && <p className="text-xs text-muted">Loading…</p>}
          </dl>
        </div>
      </div>

      {/* compliance snapshot for selling into their country */}
      {row.products?.[0]?.hs_code && <ComplianceSnapshot cc={row.country_code} hs={row.products[0].hs_code} />}

      <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
        {unlocked ? <>Unlocked by you · source: TradeIQ verified directory record · not a scraped marketplace listing.</> : <>Directory record · verified {row.verified_on ?? "date pending"} · source: TradeIQ verified directory, not a scraped marketplace listing.</>} Demonstration data.
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: string | null }) { return <div className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v ?? "—"}</dd></div>; }

function CopyInline({ value }: { value: string }) {
  const toast = useToast();
  return <button aria-label="Copy" onClick={async () => { await navigator.clipboard.writeText(value).catch(() => {}); toast({ kind: "ok", text: "Copied." }); }} className="text-faint transition-colors duration-fast hover:text-copper">⧉</button>;
}

function DraftEmailBtn({ buyer, product }: any) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const first = buyer?.contacts?.find((c: any) => c.kind === "email")?.value ?? "";
  useEffect(() => {
    if (open && !body) setBody(`To: ${first}\nSubject: ${product ?? "Indian supply"} for ${buyer?.company_name ?? ""}\n\nDear ${buyer?.city ?? "team"} sourcing team,\n\nWe are an Indian exporter of ${product ?? "your listed categories"}${buyer?.products?.[0]?.hs_code ? ` (HS ${buyer.products[0].hs_code})` : ""}, regularly shipping to ${buyer?.country ?? "your market"}.\n\nCould we send a sample pack and our current price list? Happy to work on your usual terms (${buyer?.incoterms ?? "FOB"}).\n\nRegards,\n(your name)`);
  }, [open]); // eslint-disable-line
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost">Draft intro email</button>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="pop-in card flex max-h-[80vh] w-full max-w-xl flex-col p-4 shadow-lift">
            <div className="flex items-center justify-between"><h3 className="serif text-lg">Intro email draft</h3><button onClick={() => setOpen(false)} aria-label="Close" className="text-faint hover:text-ink"><IconX className="h-4 w-4" /></button></div>
            <p className="mt-1 text-xs text-muted">Editable draft prefilled from this buyer&rsquo;s record. Nothing is sent automatically — copy it into your mail client.</p>
            <textarea value={body} onChange={e => setBody(e.target.value)} className="input mt-3 min-h-[260px] flex-1 font-mono !text-xs leading-relaxed" />
            <div className="mt-3 flex justify-end gap-2">
              <CopyAllBtn text={body} />
              <button onClick={() => setOpen(false)} className="btn-ghost">Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CopyAllBtn({ text }: { text: string }) {
  const toast = useToast();
  return <button className="btn-primary" onClick={async () => { await navigator.clipboard.writeText(text).catch(() => {}); toast({ kind: "ok", text: "Draft copied to clipboard." }); }}>Copy draft</button>;
}

function AddOutreachBtn({ id, name }: { id: number; name: string }) {
  const toast = useToast();
  return <button className="btn-ghost" onClick={async () => { try { await api(`/api/buyers/${id}/save`, { method: "POST", body: JSON.stringify({ action: "outreach" }) }); toast({ kind: "ok", text: `${name} added to outreach list.` }); } catch (e: any) { toast({ kind: "err", text: e.message }); } }}>Add to outreach</button>;
}

function ComplianceSnapshot({ cc, hs }: { cc: string; hs: string }) {
  const [res, setRes] = useState<any | null>(null);
  useEffect(() => { api(`/api/fta?country=${cc}&hs=${hs}`).then(setRes).catch(() => setRes({ error: "unavailable" })); }, [cc, hs]);
  return (
    <div className="card p-4">
      <h3 className="label mb-2">Compliance snapshot — selling into this country</h3>
      {!res ? <div className="skel h-16 w-full" /> : res.error ? <p className="text-sm text-muted">Snapshot unavailable for this pair.</p> : (
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="num"><b className="text-copper">{res.agreement ? `${res.agreement.preferentialPct}%` : `${res.mfnPct ?? res.hs.bcd_pct}%`}</b> {res.agreement ? `under ${res.agreement.name}` : "MFN duty (no FTA on file)"}</span>
            {res.agreement && <span className="num text-muted line-through">{res.agreement.mfnPct}% MFN</span>}
            <span className="text-xs text-muted">· CoO: {res.agreement ? res.agreement.cooSteps?.[1]?.match(/([A-Za-z ]*Certificate[A-Za-z ]*)/) ? "required" : "required" : "not required"}</span>
          </div>
          {res.rooWarning && <p className="rounded-field border border-warn/40 bg-warn/5 px-2.5 py-1.5 text-xs text-warn">{res.rooWarning}</p>}
          <p className="text-[11px] text-faint">Licence note: {res.hs?.licence_note || "none on file"} · Export policy: {res.hs?.policy ?? "—"}</p>
        </div>
      )}
    </div>
  );
}
