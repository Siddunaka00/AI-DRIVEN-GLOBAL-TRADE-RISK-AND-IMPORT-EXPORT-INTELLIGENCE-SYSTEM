"use client";
// Scenario library: reads the same /api/scenarios rows the calculator writes.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, useSession } from "@/components/session";
import { SkeletonRows, EmptyState } from "@/components/ui";

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function CostsPage() {
  const { me, loading } = useSession();
  const router = useRouter();
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "cost">("new");

  useEffect(() => {
    if (loading) return;
    if (!me) { router.replace("/login?next=/app/costs"); return; }
    api("/api/scenarios").then(d => setRows(d.scenarios)).catch(e => { setErr(e.message ?? "Could not load scenarios."); setRows([]); });
  }, [me, loading, router]);

  const list = (rows ?? [])
    .filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === "new" ? b.id - a.id : (b.payload?.res?.total ?? 0) - (a.payload?.res?.total ?? 0));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="serif text-2xl">Scenario library</h1>
      <p className="mt-1 text-sm text-muted">Saved landed-cost runs from your workspace — click one to reopen it in the calculator.</p>
      <div className="mt-4 flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search scenarios…" aria-label="Search scenarios" className="input !py-1.5 text-[13px]" />
        <select value={sort} onChange={e => setSort(e.target.value as any)} aria-label="Sort" className="input !w-auto !py-1.5 text-[13px]">
          <option value="new">Newest first</option><option value="cost">Highest cost</option>
        </select>
      </div>
      <div className="mt-4">
        {err ? <EmptyState title="Could not load scenarios" hint={err} action={<Link href="/app/cost" className="btn-ghost">Retry from calculator</Link>} />
          : loading || rows === null ? <SkeletonRows n={4} />
          : list.length === 0 ? (
            <EmptyState title={rows.length ? "No scenarios match that search" : "No saved scenarios yet"}
              hint={rows.length ? undefined : "Run a landed cost and press “Save scenario” — it will appear here and survive refresh."}
              action={<Link href="/app/cost" className="btn-primary">Open landed cost</Link>} />
          ) : (
            <ul className="stagger space-y-2">
              {list.map(s => (
                <li key={s.id}>
                  <Link href={`/app/cost?hs=${encodeURIComponent(s.payload?.f?.hsCode ?? "")}`} className="lift card flex items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <p className="num mt-0.5 text-xs text-muted">HS {s.payload?.f?.hsCode} · {s.payload?.f?.mode === "export" ? "India →" : "→ India"} {s.payload?.f?.country} · {s.payload?.f?.freight === "air" ? "air" : "sea"} · {s.payload?.f?.quantity} units @ ₹{s.payload?.f?.unitValueInr}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="num text-sm font-semibold text-copper">{s.payload?.res ? inr(s.payload.res.total) : "—"}</p>
                      <p className="text-[11px] text-faint">{String(s.created_at).slice(0, 10)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
