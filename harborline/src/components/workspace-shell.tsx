"use client";
// Workspace chrome: collapsible rail (desktop), drawer (mobile), top bar.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkspaceTopbar } from "./chrome";
import { IconAnchor, IconX } from "./icons";

const NAV: [string, string, string][] = [
  ["/app", "Dashboard", "⌂"],
  ["/app/buyers", "Find buyers", "◎"],
  ["/app/saved", "Saved Buyers", "☆"],
  ["/app/hs", "HS lookup", "▤"],
  ["/app/cost", "Landed cost", "₹"],
  ["/app/costs", "Scenario library", "≡"],
  ["/app/fta", "FTA checker", "⇄"],
  ["/app/incentives", "Incentives", "％"],
  ["/app/documents", "Documents", "▣"],
  ["/app/ask", "Ask TradeIQ", "✦"],
  ["/app/account", "Account Settings", "☺"],
];

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => { setDrawer(false); }, [pathname]);
  useEffect(() => { try { setCollapsed(localStorage.getItem("hl-rail") === "1"); } catch {} }, []);
  const toggleCollapse = () => setCollapsed(c => { localStorage.setItem("hl-rail", c ? "0" : "1"); return !c; });

  const rail = (
    <nav aria-label="Workspace" className={`flex h-full flex-col border-r border-white/10 bg-rail transition-[width] duration-phys ${collapsed ? "w-[52px]" : "w-52"}`}>
      <div className={`flex items-center gap-2 border-b border-white/10 px-3.5 py-3 ${collapsed ? "justify-center" : ""}`}>
        <span className="text-sky-300"><IconAnchor className="h-5 w-5" /></span>
        {!collapsed && <span className="serif text-[15px] font-semibold text-white">TradeIQ</span>}
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto py-2">
        {NAV.map(([href, label, glyph]) => {
          const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
          return (
            <li key={href} className="px-2 py-0.5">
              <Link href={href} title={label} aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-field px-2.5 py-2 text-[13px] transition-colors duration-fast ${active ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"} ${collapsed ? "justify-center !px-0" : ""}`}>
                <span className="w-4 shrink-0 text-center text-[13px]" aria-hidden>{glyph}</span>
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-white/10 p-2">
        <button onClick={toggleCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center gap-2 rounded-field px-2 py-1.5 text-xs text-slate-400 transition-colors duration-fast hover:bg-white/5 hover:text-slate-100">
          <span className={`inline-block transition-transform duration-phys ${collapsed ? "rotate-180" : ""}`} aria-hidden>⟨</span>
          {!collapsed && "Collapse"}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className="hidden md:block">{rail}</aside>
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label="Navigation">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <div className="sheet-up absolute inset-y-0 left-0 w-60 shadow-sheet">
            <div className="flex items-center justify-between border-b border-white/10 bg-rail px-3 py-2.5">
              <span className="serif text-sm font-semibold text-white">TradeIQ</span>
              <button onClick={() => setDrawer(false)} aria-label="Close navigation" className="text-slate-400 hover:text-white"><IconX className="h-4 w-4" /></button>
            </div>
            <div className="h-[calc(100%-45px)]">{rail}</div>
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceTopbar onOpenNav={() => setDrawer(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
