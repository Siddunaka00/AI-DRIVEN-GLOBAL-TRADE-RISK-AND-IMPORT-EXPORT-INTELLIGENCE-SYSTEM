"use client";
// Ask TradeIQ — chat over the deterministic intent router. Every answer
// carries sources + the reasoning line, so nothing reads like a black box.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "./session";
import { IconSpark } from "./icons";

const SUGGESTIONS = ["Landed cost of basmati to UAE", "RoDTEP on cotton T-shirts", "FTA for cumin to Thailand", "buyers for turmeric in the UK"];

type Msg = { role: "you" | "hl"; text: string; data?: any; sources?: string[]; why?: string; error?: string };

export default function AskPanel({ initialQ = "", compact = true }: any) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (initialQ) send(String(initialQ)); else if (!compact) send(SUGGESTIONS[0]); }, []); // eslint-disable-line
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  async function send(text: string) {
    const t = text.trim(); if (!t || busy) return;
    setQ(""); setMsgs(m => [...m, { role: "you", text: t }]); setBusy(true);
    try {
      const d = await api("/api/ask", { method: "POST", body: JSON.stringify({ prompt: t }) });
      setMsgs(m => [...m, { role: "hl", text: d.answer ?? d.error ?? "No structured answer returned.", data: d.data, sources: d.sources, why: d.why }]);
    } catch (e: any) { setMsgs(m => [...m, { role: "hl", text: e.message, error: "1" }]); }
    finally { setBusy(false); inputRef.current?.focus(); }
  }

  return (
    <div className={compact ? "flex h-full min-h-0 flex-col" : "mx-auto flex max-w-3xl flex-col px-4 py-8 sm:px-6"} style={compact ? {} : { height: "calc(100vh - 3.5rem)" }}>
      {!compact && <header className="mb-4"><h1 className="serif flex items-center gap-2 text-3xl"><IconSpark className="h-6 w-6 text-copper" /> Ask TradeIQ</h1><p className="mt-1 text-sm text-muted">Plain questions over real records — buyers, costs, FTAs, incentives. Answers cite the exact table rows they used.</p></header>}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto py-1" aria-live="polite">
        {msgs.length === 0 && !busy && (
          <div className="card p-4 text-sm text-muted">
            <p className="label mb-2 text-copper">Try</p>
            <div className="flex flex-wrap gap-1.5">{SUGGESTIONS.map(s => <button key={s} onClick={() => send(s)} className="chip hover:border-copper hover:text-copper">{s}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => m.role === "you" ? (
          <div key={i} className="ml-auto max-w-[85%] rounded-card rounded-br-sm bg-ink px-3.5 py-2 text-sm text-paper">{m.text}</div>
        ) : (
          <div key={i} className="rise max-w-[92%]">
            <div className={`card px-3.5 py-3 text-sm leading-relaxed ${m.error ? "!border-bad/40" : ""}`}>{m.text}</div>
            {m.data?.buyers?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {m.data.buyers.map((b: any) => <Link key={b.id} href={`/buyers/${b.id}`} className="chip lift hover:border-copper hover:text-copper">{b.name} · <span className="num text-copper">{b.score}</span></Link>)}
              </div>
            )}
            {m.data?.result && (
              <div className="mt-1.5 chip num">landed ₹{m.data.result.total.toLocaleString("en-IN")} · ₹{m.data.result.perUnit.toLocaleString("en-IN")}/unit</div>
            )}
            {m.why && <p className="mt-1.5 border-l-2 border-copper/40 pl-2.5 text-[11px] leading-relaxed text-muted"><b className="text-copper">Why:</b> {m.why}</p>}
            {!!m.sources?.length && <p className="mt-1 pl-2.5 text-[10px] uppercase tracking-wide text-faint">sources: {m.sources.join(" · ")}</p>}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 px-1 text-xs text-muted" aria-label="Assistant is thinking">
            <span className="dot-pulse" /><span className="dot-pulse [animation-delay:150ms]" /><span className="dot-pulse [animation-delay:300ms]" /> reading the tables…
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={e => { e.preventDefault(); send(q); }} className="mt-3 flex gap-2">
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Landed cost of basmati to UAE…" aria-label="Ask TradeIQ" className="input !py-2.5" />
        <button disabled={busy || !q.trim()} className="btn-primary !px-4">Ask</button>
      </form>
    </div>
  );
}
