"use client";
// Shared login/register card. Real POSTs to the API routes; on success it
// routes to ?next or the workspace. Demo credentials prefilled at the click
// of a button — they exist in the seeded DB.
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "./session";
import { Spinner } from "./ui";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";
  const [f, setF] = useState({ email: "", password: "", fullName: "", company: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const set = (k: string) => (e: any) => setF(s => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify(f) });
      router.push(next); router.refresh();
    } catch (ex: any) { setErr(ex.message); setBusy(false); }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-10">
      <div className="card rise px-6 py-7 shadow-lift">
        <h1 className="serif text-2xl">{mode === "login" ? "Welcome back" : "Open your trade desk"}</h1>
        <p className="mt-1 text-sm text-muted">{mode === "login" ? "Sign in to unlocks, saved buyers and documents." : "Free account · 3 buyer unlocks included · no card."}</p>
        <form onSubmit={submit} className="mt-5 space-y-3.5" noValidate>
          {mode === "register" && (
            <>
              <div><label className="label mb-1 block" htmlFor="fn">Your name</label>
                <input id="fn" required value={f.fullName} onChange={set("fullName")} className="input" placeholder="Asha Menon" autoComplete="name" /></div>
              <div><label className="label mb-1 block" htmlFor="co">Company <span className="normal-case opacity-60">(optional)</span></label>
                <input id="co" value={f.company} onChange={set("company")} className="input" placeholder="Konkan Spice Exports" autoComplete="organization" /></div>
            </>
          )}
          <div><label className="label mb-1 block" htmlFor="em">Email</label>
            <input id="em" type="email" required value={f.email} onChange={set("email")} className="input" placeholder="you@company.in" autoComplete="email" /></div>
          <div>
            <label className="label mb-1 block" htmlFor="pw">Password{mode === "register" && <span className="normal-case opacity-60"> · 8+ characters</span>}</label>
            <div className="relative">
              <input id="pw" type={show ? "text" : "password"} required minLength={mode === "register" ? 8 : undefined} value={f.password} onChange={set("password")} className="input pr-16" autoComplete={mode === "login" ? "current-password" : "new-password"} />
              <button type="button" onClick={() => setShow(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-copper">{show ? "hide" : "show"}</button>
            </div>
          </div>
          {err && <p role="alert" className="rounded-field border border-bad/40 bg-bad/5 px-3 py-2 text-[13px] text-bad">{err}</p>}
          <button disabled={busy} className="btn-primary w-full !py-2.5">{busy ? <Spinner /> : mode === "login" ? "Log in" : "Create account"}</button>
        </form>
        {mode === "login" && (
          <button type="button" onClick={() => { setF(s => ({ ...s, email: "demo@harborline.test", password: "harborline" })); setErr(null); }}
            className="chip mt-3 w-full justify-center transition-colors duration-fast hover:border-copper hover:text-copper">
            Use demo account — demo@harborline.test / harborline
          </button>
        )}
        <p className="mt-4 text-center text-sm text-muted">
          {mode === "login" ? <>No account? <Link href="/register" className="text-copper hover:underline">Register free</Link></>
                   : <>Already have one? <Link href="/login" className="text-copper hover:underline">Log in</Link></>}
        </p>
      </div>
    </div>
  );
}
