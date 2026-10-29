"use client";
// Client-side session hook: /api/auth/me returns the live DB user (counts are
// real, never a silent mock). Router refresh keeps it fresh after unlocks.
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface Me {
  id: number; email: string; fullName: string; company: string | null;
  plan: "free" | "pro"; credits: number; savedCount?: number; unlockedCount?: number;
}

export function useSession() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      setMe(r.ok ? await r.json() : null);
    } catch { setMe(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { me, loading, reload: load, setMe };
}

// Guard for workspace pages: bounce to /login with a return path.
export function useRequireAuth(ready: boolean, me: Me | null) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (ready && !me) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, me, router, pathname]);
}

export async function api(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(path, {
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Request failed (${res.status})`), { status: res.status, code: data.code, data });
  return data;
}
