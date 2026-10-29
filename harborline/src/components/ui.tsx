"use client";
// Shared UI primitives: toasts, confirm dialog, theme toggle, skeletons, empty
// states. Kept tiny and dependency-free (framer-motion only where it earns its
// keep). Motion is 140–180ms, physical, and respects prefers-reduced-motion via CSS.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconCheck, IconAlert, IconX, IconSun, IconMoon } from "./icons";

/* ---------------- toasts ---------------- */
type Toast = { id: number; kind: "ok" | "err" | "info"; text: string };
const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastHost({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setItems(s => [...s, { ...t, id }]);
    setTimeout(() => setItems(s => s.filter(x => x.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-[90] flex w-[min(92vw,360px)] flex-col gap-2">
        {items.map(t => (
          <div key={t.id} role="status"
            className={`toast-in card flex items-start gap-2 px-3.5 py-2.5 text-sm shadow-lift ${
              t.kind === "ok" ? "border-ok/40" : t.kind === "err" ? "border-bad/40" : ""}`}>
            <span className={t.kind === "ok" ? "text-ok" : t.kind === "err" ? "text-bad" : "text-copper"}>
              {t.kind === "ok" ? <IconCheck className="mt-0.5 h-4 w-4" /> : <IconAlert className="mt-0.5 h-4 w-4" />}
            </span>
            <span className="flex-1">{t.text}</span>
            <button onClick={() => setItems(s => s.filter(x => x.id !== t.id))} aria-label="Dismiss" className="text-faint hover:text-ink"><IconX className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- confirm dialog ---------------- */
export function ConfirmDialog({ open, title, body, confirmLabel = "Confirm", danger, busy, onConfirm, onClose }: {
  open: boolean; title: string; body: React.ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean;
  onConfirm: () => void; onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}
        className="pop-in card w-full max-w-sm px-5 py-4 shadow-lift">
        <h3 className="serif text-lg">{title}</h3>
        <div className="mt-1.5 text-sm text-muted">{body}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={danger ? "btn bg-bad text-white hover:bg-bad/90 active:translate-y-px" : "btn-primary"} onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- theme toggle ---------------- */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const flip = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("hl-theme", next ? "dark" : "light"); } catch {}
  };
  return (
    <button onClick={flip} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="grid h-8 w-8 place-items-center rounded-field border border-line text-muted transition-colors duration-fast hover:border-copper hover:text-copper">
      {mounted && dark ? <IconSun className="h-4 w-4 spin-in" /> : <IconMoon className="h-4 w-4" />}
    </button>
  );
}

/* ---------------- copy button ---------------- */
export function CopyBtn({ value, label }: { value: string; label?: string }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label={`Copy ${label ?? value}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); } catch {
          const ta = document.createElement("textarea"); ta.value = value; document.body.appendChild(ta);
          ta.select(); document.execCommand("copy"); ta.remove();
        }
        setDone(true); toast({ kind: "ok", text: `Copied ${label ?? "value"}.` });
        setTimeout(() => setDone(false), 1200);
      }}
      className="chip hover:border-copper hover:text-copper">
      {done ? <IconCheck className="h-3 w-3 text-ok" /> : <span className="font-mono">⧉</span>} copy
    </button>
  );
}

/* ---------------- skeletons & empty states ---------------- */
export function SkeletonRows({ n = 5 }: { n?: number }) {
  return (
    <div className="flex flex-col gap-2.5" aria-label="Loading results">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card p-3.5">
          <div className="skel mb-2 h-4 w-2/5" />
          <div className="skel mb-1.5 h-3 w-4/5" />
          <div className="skel h-3 w-3/5" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="rise card grid place-items-center px-6 py-12 text-center">
      <svg viewBox="0 0 48 48" className="mb-3 h-10 w-10 text-faint" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M8 18 24 8l16 10v20a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" /><path d="M8 18h32M18 40V28h12v12" />
      </svg>
      <p className="serif text-base">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------- small display bits ---------------- */
export function Badge({ tone, children }: { tone: "ok" | "warn" | "bad" | "copper" | "muted"; children: React.ReactNode }) {
  const map = { ok: "border-ok/50 text-ok", warn: "border-warn/50 text-warn", bad: "border-bad/50 text-bad", copper: "border-copper/60 text-copper", muted: "text-muted" };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${map[tone]}`}>{children}</span>;
}

export function Meter({ value, max = 100 }: { value: number; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { // animate width after mount — short, physical
    const el = ref.current; if (!el) return;
    el.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => (el.style.width = `${Math.min(100, (value / max) * 100)}%`)));
  }, [value, max]);
  return <div className="meter"><div ref={ref} className="h-full rounded-full bg-copper" style={{ width: `${(value / max) * 100}%`, transition: "width 180ms ease-out" }} /></div>;
}

export function CountUp({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    let raf = 0; const t0 = performance.now(); const dur = 500;
    const step = (t: number) => { const k = Math.min(1, (t - t0) / dur); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span className="num">{prefix}{v.toLocaleString("en-IN")}{suffix}</span>;
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-copper/30 border-t-copper ${className}`} aria-label="Loading" />;
}
