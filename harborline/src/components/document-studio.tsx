"use client";
// Document studio — form → POST /api/documents/generate → server-rendered HTML
// preview in a paper frame. Print button opens the browser print dialog
// (Save as PDF). Documents are drafts: never claim certification.
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, useSession } from "./session";
import { Badge, EmptyState, Spinner, useToast } from "./ui";
import { IconPrint, IconDoc } from "./icons";

const KINDS: [string, string][] = [["proforma", "Proforma invoice"], ["commercial", "Commercial invoice"], ["packing", "Packing list"], ["quotation", "Quotation"]];

export default function DocumentStudio({ initialBuyer = 0, initialHs = "", compact = false }: any) {
  const toast = useToast();
  const { me } = useSession();
  const [kind, setKind] = useState<string>(KINDS[0][0]);
  const [f, setF] = useState({ buyerId: initialBuyer ? String(initialBuyer) : "", hsCode: initialHs, quantity: "5000", unitValueInr: "220", packSize: "50" });
  const [buyers, setBuyers] = useState<any[]>([]);
  const [doc, setDoc] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const set = (k: string) => (e: any) => setF(s => ({ ...s, [k]: e.target.value }));

  useEffect(() => { api("/api/buyers/search?q=spices").then(d => setBuyers(d.results.slice(0, 40))).catch(() => {}); }, []);
  useEffect(() => { if (me) api("/api/documents").then(d => setHistory(d.documents)).catch(() => {}); }, [me]);

  async function generate() {
    setBusy(true); setErr(null); setDoc(null);
    try {
      const d = await api("/api/documents/generate", { method: "POST", body: JSON.stringify({
        kind, buyerId: f.buyerId ? Number(f.buyerId) : undefined, hsCode: f.hsCode.replace(/\D/g, ""),
        quantity: Number(f.quantity), unitValueInr: Number(f.unitValueInr), packSize: Number(f.packSize) || undefined,
        sellerName: me?.company || undefined,
      })});
      setDoc(d); setHistory(h => [{ id: d.id, kind, title: d.title, created_at: "just now" }, ...h]);
      toast({ kind: "ok", text: "Draft generated and saved to your documents." });
    } catch (e: any) {
      if (e.status === 401) { toast({ kind: "info", text: "Sign in to generate documents." }); window.location.href = `/login?next=${encodeURIComponent("/app/documents")}`; }
      else { setErr(e.message); }
    } finally { setBusy(false); }
  }

  return (
    <div className={compact ? "" : "mx-auto max-w-5xl px-4 py-8 sm:px-6"}>
      {!compact && <header className="mb-5"><h1 className="serif text-3xl">Document studio</h1><p className="mt-1 text-sm text-muted">Prefill from a buyer and HS record, generate, print to PDF. Drafts for your review — not certified documents.</p></header>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div className="space-y-4">
          <form className="card space-y-3 p-4" onSubmit={e => e.preventDefault()}>
            <div role="tablist" aria-label="Document type" className="grid grid-cols-2 gap-1.5">
              {KINDS.map(([v, l]) => (
                <button key={v} role="tab" aria-selected={kind === v} onClick={() => setKind(v)}
                  className={`rounded-field border px-2 py-2 text-xs transition-colors duration-fast ${kind === v ? "chip-on !border-copper font-medium text-copper" : "border-line text-muted hover:border-copper/50"}`}>{l}</button>
              ))}
            </div>
            <label className="block text-xs text-muted">Buyer (optional — prefills consignee)
              <select value={f.buyerId} onChange={set("buyerId")} className="input mt-1 !py-2">
                <option value="">— no buyer —</option>
                {buyers.map(b => <option key={b.id} value={b.id}>{b.company_name}, {b.country}</option>)}
              </select></label>
            <label className="block text-xs text-muted">HS code<input required value={f.hsCode} onChange={set("hsCode")} placeholder="090921" className="input num mt-1 !py-2" /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted">Quantity<input type="number" min="1" value={f.quantity} onChange={set("quantity")} className="input num mt-1 !py-2" /></label>
              <label className="text-xs text-muted">FOB ₹/unit<input type="number" min="1" value={f.unitValueInr} onChange={set("unitValueInr")} className="input num mt-1 !py-2" /></label>
            </div>
            {kind === "packing" && <label className="block text-xs text-muted">Units per carton<input value={f.packSize} onChange={set("packSize")} className="input num mt-1 !py-2" /></label>}
            <button onClick={generate} disabled={busy} className="btn-primary w-full !py-2.5">{busy ? <Spinner /> : "Generate draft"}</button>
            {err && <p role="alert" className="rounded-field border border-bad/40 bg-bad/5 px-3 py-2 text-xs text-bad">{err}</p>}
          </form>
          {history.length > 0 && (
            <div className="card p-3">
              <p className="label mb-1.5">Your documents</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                {history.map(h => (
                  <li key={h.id}>
                    <button onClick={async () => { try { setDoc(await api(`/api/documents/${h.id}`)); } catch (e: any) { toast({ kind: "err", text: e.message }); } }}
                      className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left hover:bg-paper">
                      <IconDoc className="h-3.5 w-3.5 shrink-0 text-copper" /><span className="min-w-0 flex-1 truncate">{h.title}</span><span className="num text-[10px] text-faint">{String(h.created_at).slice(0, 10)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div>
          {busy && <div className="card grid h-72 place-items-center"><Spinner className="h-6 w-6" /></div>}
          {!busy && !doc && <EmptyState title="No draft yet" hint="Fill the form and generate — the document renders here inside a print frame, prefilled with the buyer&rsquo;s details and the HS duty note." />}
          {!busy && doc && (
            <div className="rise card overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
                <div className="flex items-center gap-2"><Badge tone="muted">Draft · for review</Badge><span className="num text-xs text-faint">#{doc.id}</span></div>
                <div className="flex gap-2">
                  <button className="btn-ghost !py-1 text-xs" onClick={() => navigator.clipboard.writeText(doc.html).then(() => toast({ kind: "ok", text: "HTML copied." }))}>Copy HTML</button>
                  <button className="btn-primary !py-1 text-xs" onClick={() => {
                    const fr = document.getElementById("doc-frame") as HTMLIFrameElement | null; fr?.contentWindow?.focus(); fr?.contentWindow?.print();
                  }}><IconPrint className="h-3.5 w-3.5" /> Print / Save PDF</button>
                </div>
              </div>
              <iframe id="doc-frame" title="Document preview" srcDoc={wrapDoc(doc.html)} className="h-[560px] w-full border-0 bg-white" sandbox="allow-same-origin allow-popups" />
              <p className="border-t border-line px-4 py-2 text-[11px] text-faint">Generated from live DB records · check every figure before sending · TradeIQ does not certify or submit documents. <Link href="/app/ask" className="text-copper hover:underline">Ask about this shipment →</Link></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function wrapDoc(html: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:Georgia,'Times New Roman',serif;color:#14213d;margin:0;padding:28px 32px;font-size:13px;background:#fff}
h1,h2{letter-spacing:.06em;text-transform:uppercase;font-size:15px;margin:0 0 4px}
table{border-collapse:collapse;width:100%;margin:14px 0}td,th{border:1px solid #d9d4cb;padding:6px 8px;text-align:left;font-size:12px}
th{background:#faf7f1}.num{font-variant-numeric:tabular-nums;text-align:right}.rule{border-top:2px solid #246bfd;margin:10px 0}
.small{font-size:10px;color:#6f6a61}.brand{color:#246bfd}@media print{body{padding:0}}</style></head><body>${html}</body></html>`;
}
