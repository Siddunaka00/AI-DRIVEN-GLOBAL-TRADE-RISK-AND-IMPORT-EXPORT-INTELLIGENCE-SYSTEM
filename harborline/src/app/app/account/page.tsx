"use client";
// Account & data: profile edit, password change, real usage figures,
// GDPR-style export and delete — all wired to existing API routes.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, useSession } from "@/components/session";
import { ConfirmDialog, useToast, Spinner } from "@/components/ui";

function EyeBtn({ show, onClick }: { show: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-copper">{show ? "hide" : "show"}</button>;
}

export default function AccountPage() {
  const { me, loading, reload } = useSession();
  const router = useRouter();
  const toast = useToast();

  // ---- profile form ----
  const [name, setName] = useState(""); const [company, setCompany] = useState("");
  const [savingP, setSavingP] = useState(false);
  useEffect(() => { if (me) { setName(me.fullName); setCompany(me.company ?? ""); } }, [me]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSavingP(true);
    try { await api("/api/account/profile", { method: "PATCH", body: JSON.stringify({ fullName: name, company }) }); await reload(); toast({ kind: "ok", text: "Profile updated." }); }
    catch (err: any) { toast({ kind: "err", text: err.message ?? "Could not save profile." }); }
    finally { setSavingP(false); }
  }

  // ---- password form ----
  const [cur, setCur] = useState(""); const [next, setNext] = useState(""); const [conf, setConf] = useState("");
  const [show, setShow] = useState(false); const [savingW, setSavingW] = useState(false);
  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) { toast({ kind: "err", text: "New password must be at least 8 characters." }); return; }
    if (next !== conf) { toast({ kind: "err", text: "New passwords do not match." }); return; }
    setSavingW(true);
    try { await api("/api/account/password", { method: "POST", body: JSON.stringify({ current: cur, next }) });
      setCur(""); setNext(""); setConf(""); toast({ kind: "ok", text: "Password changed. Other sessions were signed out." }); }
    catch (err: any) { toast({ kind: "err", text: err.status === 401 ? "Current password is incorrect." : err.message ?? "Could not change password." }); }
    finally { setSavingW(false); }
  }

  // ---- usage numbers (real rows, same queries as GET /api/saved etc.) ----
  const [usage, setUsage] = useState<any | null>(null);
  useEffect(() => { if (!me) return;
    Promise.all([api("/api/scenarios").then(d => d.scenarios.length).catch(() => null),
                 api("/api/documents").then(d => (d.documents ?? []).length).catch(() => null)])
      .then(([sc, dc]) => setUsage({ scenarios: sc, documents: dc }));
  }, [me]);

  // ---- export / delete ----
  const [confirmDel, setConfirmDel] = useState(false);
  const [typed, setTyped] = useState(""); const [deleting, setDeleting] = useState(false);
  async function exportData() {
    try {
      const r = await fetch("/api/account/export", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const blob = await r.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "harborline-account-export.json"; a.click();
      URL.revokeObjectURL(url); toast({ kind: "ok", text: "Account data exported as JSON." });
    } catch { toast({ kind: "err", text: "Export failed — please sign in again and retry." }); }
  }
  async function deleteAccount() {
    setDeleting(true);
    try {
      const r = await fetch("/api/account/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: typed.trim().toLowerCase() }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error ?? "Deletion failed."); }
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      router.replace("/login");
    } catch (err: any) { toast({ kind: "err", text: err.message }); }
    finally { setDeleting(false); setConfirmDel(false); }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-16"><Spinner className="h-5 w-5 text-copper" /></div>;
  if (!me) { router.replace("/login?next=/app/account"); return null; }

  return (
    <div className="stagger mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <div><h1 className="serif text-2xl">Account &amp; data</h1><p className="mt-1 text-sm text-muted">Your profile, security and everything TradeIQ stores about you.</p></div>

      <section className="card p-4">
        <h2 className="label mb-3">Profile</h2>
        <form onSubmit={saveProfile} className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-muted">Full name<input required minLength={2} value={name} onChange={e => setName(e.target.value)} className="input mt-1 !py-2" /></label>
          <label className="block text-xs text-muted">Company<input value={company} onChange={e => setCompany(e.target.value)} placeholder="Trading house / firm" className="input mt-1 !py-2" /></label>
          <div className="sm:col-span-2 flex items-center justify-between gap-3">
            <p className="text-xs text-faint">Email <span className="num">{me.email}</span> is your sign-in identity and cannot be changed here.</p>
            <button className="btn-primary !py-1.5 text-[13px] disabled:opacity-50" disabled={savingP}>{savingP ? "Saving…" : "Save profile"}</button>
          </div>
        </form>
      </section>

      <section className="card p-4">
        <h2 className="label mb-3">Security</h2>
        <form onSubmit={savePassword} className="grid gap-3 sm:grid-cols-3">
          <label className="relative block text-xs text-muted">Current password<input required type={show ? "text" : "password"} value={cur} onChange={e => setCur(e.target.value)} className="input mt-1 !py-2 pr-12" autoComplete="current-password" /><EyeBtn show={show} onClick={() => setShow(s => !s)} /></label>
          <label className="block text-xs text-muted">New password (min 8)<input required type={show ? "text" : "password"} value={next} onChange={e => setNext(e.target.value)} className="input mt-1 !py-2" autoComplete="new-password" /></label>
          <label className="block text-xs text-muted">Confirm new<input required type={show ? "text" : "password"} value={conf} onChange={e => setConf(e.target.value)} className="input mt-1 !py-2" autoComplete="new-password" /></label>
          <div className="sm:col-span-3 flex items-center justify-between">
            <p className="text-[11px] text-faint">Changing the password signs out your other sessions. No email-reset flow exists yet.</p>
            <button className="btn-ghost !py-1.5 text-[13px] disabled:opacity-50" disabled={savingW || !cur || !next}>{savingW ? "Updating…" : "Change password"}</button>
          </div>
        </form>
      </section>

      <section className="card p-4">
        <h2 className="label mb-3">Usage</h2>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[["Buyers unlocked", me.unlockedCount ?? usage?.unlocks ?? "…"], ["Saved buyers", me.savedCount ?? "…"], ["Scenarios saved", usage?.scenarios ?? "…"], ["Documents", usage?.documents ?? "…"]].map(([l, v]: any, i) => (
            <div key={i} className="rounded-field bg-paper px-2 py-3"><p className="num serif text-xl text-copper">{v}</p><p className="mt-0.5 text-[11px] text-muted">{l}</p></div>
          ))}
        </div>
        <p className="mt-3 rounded-field bg-elevate px-3 py-2 text-xs leading-relaxed text-muted">
          This is an academic project — there are no plans, credits or payments. Every feature, including contact unlocking, is free. The numbers above come from your real activity in this workspace.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="label mb-2">Your data</h2>
        <p className="text-sm text-muted">Everything we store for you: profile, unlocks, saved buyers, outreach, scenarios, documents and an audit log of your actions. Contacts you unlock come from our verified demonstration directory, each with a check date.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={exportData} className="btn-ghost !py-1.5 text-[13px]">Export my data (JSON)</button>
        </div>
      </section>

      <section className="card border-red-300/60 p-4 dark:!border-bad/40">
        <h2 className="label mb-2 !text-bad">Danger zone</h2>
        <p className="text-sm text-muted">Permanently deletes your account, unlocks, saved buyers, scenarios, documents and audit history. This cannot be undone.</p>
        <button onClick={() => { setConfirmDel(true); setTyped(""); }} disabled={typed === me.email} className="btn mt-3 !border !border-bad/50 text-[13px] text-bad hover:bg-bad/10">Delete account…</button>
      </section>

      <ConfirmDialog open={confirmDel} title="Delete this account?" danger busy={deleting}
        confirmLabel={deleting ? "Deleting…" : "Permanently delete"}
        onClose={() => setConfirmDel(false)} onConfirm={deleteAccount}
        body={<span>This removes your account and every record tied to it, with no undo. Type your email <b className="num text-bad">{me.email}</b> below to confirm.<input value={typed} onChange={e => setTyped(e.target.value)} placeholder={me.email} className="input mt-2 !py-1.5" aria-label="Type your email to confirm deletion" autoComplete="off" /></span>} />
    </div>
  );
}
