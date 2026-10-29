"use client";
// Hero search — real input that routes into the buyer split view with the
// query carried in the URL. Enter submits; suggestions hit the live API.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "./session";

const EXAMPLES = ["cumin USA", "basmati rice UAE", "cotton t-shirts UK", "0909"];

export default function HomeHero() {
  const [q, setQ] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const router = useRouter();
  const t = useRef<any>();

  // gentle live count so the field feels connected to real data
  useEffect(() => {
    if (!q.trim()) { setHint(null); return; }
    clearTimeout(t.current);
    t.current = setTimeout(async () => {
      try {
        const d = await api(`/api/buyers/search?q=${encodeURIComponent(q)}`);
        setHint(d.count ? `${d.count} directory matches for “${q}”` : `No matches yet — try ${EXAMPLES[0]}.`);
      } catch { setHint(null); }
    }, 350);
    return () => clearTimeout(t.current);
  }, [q]);

  return (
    <form className="mt-8 max-w-xl" onSubmit={e => { e.preventDefault(); router.push(`/buyers?q=${encodeURIComponent(q || "spices")}`); }}>
      <div className="flex gap-2">
        <label htmlFor="hero-q" className="sr-only">Search buyers by product, common name or HS code</label>
        <input id="hero-q" value={q} onChange={e => setQ(e.target.value)} placeholder="cumin · basmati rice · 0909 · cotton t-shirts USA"
          className="input !rounded-field !py-3 text-[15px]" autoComplete="off" />
        <button className="btn-primary !px-5 !py-3">Search</button>
      </div>
      <p className="num mt-2 h-5 text-[13px] text-copper" aria-live="polite">{hint ?? ""}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <span className="label mr-1">Try</span>
        {EXAMPLES.map(x => (
          <button type="button" key={x} onClick={() => { setQ(x); router.push(`/buyers?q=${encodeURIComponent(x)}`); }}
            className="chip hover:border-copper hover:text-copper transition-colors duration-fast">{x}</button>
        ))}
      </div>
    </form>
  );
}
