"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./session";
import { useToast, ConfirmDialog } from "./ui";
import { IconBookmark } from "./icons";

export default function BuyerProfileActions({ buyerId, buyerName, unlocked, saved, firstHs, loggedIn }: any) {
  const router = useRouter(); const toast = useToast();
  const [isSaved, setSaved] = useState(!!saved);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const next = encodeURIComponent(`/app/buyers?open=${buyerId}`);

  async function unlock() {
    setBusy(true);
    try {
      const d = await api(`/api/buyers/${buyerId}/unlock`, { method: "POST" });
      toast({ kind: "ok", text: d.alreadyUnlocked ? "Already unlocked." : "Contacts unlocked — free in this academic build." });
      router.refresh();
    } catch (e: any) { toast({ kind: "err", text: e.message }); }
    finally { setBusy(false); setConfirm(false); }
  }
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button onClick={async () => {
        if (!loggedIn) { toast({ kind: "info", text: "Sign in to save buyers." }); router.push(`/login?next=${next}`); return; }
        const d = await api(`/api/buyers/${buyerId}/save`, { method: "POST", body: "{}" }).catch(e => { toast({ kind: "err", text: e.message }); return null; });
        if (d) { setSaved(d.saved); toast({ kind: "ok", text: d.saved ? "Saved." : "Removed from saved." }); }
      }} className={isSaved ? "btn chip-on !border-copper text-copper" : "btn-ghost"}><IconBookmark className="h-3.5 w-3.5" />{isSaved ? "Saved" : "Save"}</button>
      {!unlocked && (loggedIn
        ? <button onClick={() => setConfirm(true)} className="btn-primary">Unlock contacts</button>
        : <Link href={`/login?next=${next}`} className="btn-primary">Log in to unlock</Link>)}
      {unlocked && <>
        <Link href={`/app/documents?buyer=${buyerId}&hs=${firstHs}`} className="btn-ghost">Proforma invoice</Link>
        <Link href={`/app/ask?q=${encodeURIComponent(`intro email ${buyerName}`)}`} className="btn-ghost">Draft intro</Link>
      </>}
      <ConfirmDialog open={confirm} busy={busy} title={`Unlock ${buyerName}?`} confirmLabel="Unlock contacts"
        body={<>Free in this academic build. The unlock is written to your activity history so you can track who you contacted.</>}
        onConfirm={unlock} onClose={() => setConfirm(false)} />
    </div>
  );
}
