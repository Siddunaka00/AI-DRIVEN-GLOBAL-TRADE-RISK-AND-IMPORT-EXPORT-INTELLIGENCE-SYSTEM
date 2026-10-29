"use client";
// Small chrome pieces used by both marketing and workspace shells.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, useSession } from "./session";
import { ThemeToggle } from "./ui";
import { IconBell, IconMenu, IconX, IconLogout, IconUser } from "./icons";

export { ThemeToggle };

export function LoginLinks() {
  return (
    <>
      <Link href="/login" className="btn-quiet hidden sm:inline-flex">Log in</Link>
      <Link href="/register" className="btn-primary !py-1.5 text-[13px]">Get started</Link>
    </>
  );
}

/* Workspace top bar: search jumps into buyer results, notifications are the
   user's own recent audit events (real records, not decoration). */
export function WorkspaceTopbar({ onOpenNav }: { onOpenNav: () => void }) {
  const { me, loading } = useSession();
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState<any[] | null>(null);
  const [openBell, setOpenBell] = useState(false);
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex h-13 items-center gap-2 border-b border-line bg-paper/90 px-3 py-2 backdrop-blur sm:gap-3 sm:px-5">
      <button onClick={onOpenNav} aria-label="Open navigation" className="btn !px-2 md:hidden"><IconMenu className="h-5 w-5" /></button>
      <form className="relative max-w-xs flex-1" onSubmit={e => { e.preventDefault(); router.push(`/app/buyers?q=${encodeURIComponent(q)}`); }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search buyers, HS codes…" aria-label="Global search"
          className="input !py-1.5 pl-8 text-[13px]" />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint">⌕</span>
      </form>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button aria-label="Notifications" className="btn !px-2 text-muted hover:text-copper" onClick={async () => {
            if (!openBell && notes === null) { try { const d = await api("/api/account/notifications"); setNotes(d.items); } catch { setNotes([]); } }
            setOpenBell(v => !v);
          }}><IconBell className="h-4 w-4" /></button>
          {openBell && (
            <div className="pop-in card absolute right-0 top-10 z-40 w-72 p-2 shadow-lift">
              <p className="label px-2 py-1">Your recent activity</p>
              {!notes ? <p className="px-2 py-3 text-sm text-muted">Loading…</p>
                : notes.length === 0 ? <p className="px-2 py-3 text-sm text-muted">Nothing yet — unlocks, saves and documents land here.</p>
                : notes.slice(0, 6).map((n: any) => (
                    <p key={n.id} className="rounded px-2 py-1.5 text-[13px] hover:bg-paper"><span className="text-copper">{n.action}</span> · <span className="text-muted">{n.detail ?? ""}</span><span className="block text-[11px] text-faint">{n.created_at}</span></p>
                  ))}
            </div>
          )}
        </div>
                <ThemeToggle />
        {loading ? (
          <div className="skel h-8 w-8 rounded-full" />
        ) : me ? (
          <details className="group relative">
            <summary className="grid h-8 w-8 cursor-pointer list-none place-items-center rounded-full border border-line text-muted transition-colors duration-fast hover:border-copper hover:text-copper" aria-label="Account menu">
              <IconUser className="h-4 w-4" />
            </summary>
            <div className="pop-in card absolute right-0 top-10 z-40 w-52 p-1.5 shadow-lift">
              <p className="px-2.5 py-1.5 text-sm font-medium">{me.fullName}</p>
              <p className="px-2.5 pb-1.5 text-xs text-faint">{me.email}</p>
              <div className="rule my-1" />
              <Link href="/app/account" className="block rounded px-2.5 py-1.5 text-sm hover:bg-paper">Account & data</Link>
              <Link href="/features" className="block rounded px-2.5 py-1.5 text-sm hover:bg-paper">Project features</Link>
              <form action="/api/auth/logout" method="POST">
                <button className="flex w-full items-center gap-1.5 rounded px-2.5 py-1.5 text-left text-sm text-bad hover:bg-paper"><IconLogout className="h-3.5 w-3.5" /> Log out</button>
              </form>
            </div>
          </details>
        ) : <LoginLinks />}
      </div>
    </header>
  );
}

export function CloseBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} aria-label="Close" className="btn !px-2 text-muted hover:text-ink"><IconX className="h-5 w-5" /></button>;
}
