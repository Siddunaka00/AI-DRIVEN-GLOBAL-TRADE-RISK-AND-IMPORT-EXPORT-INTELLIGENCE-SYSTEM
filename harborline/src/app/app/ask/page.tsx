import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import AskPanel from "@/components/ask-panel";

export const metadata = { title: "Ask TradeIQ" };

export default function Page({ searchParams }: { searchParams: { q?: string } }) {
  if (!currentUser()) redirect("/login?next=/app/ask");
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="serif text-2xl">Ask TradeIQ</h1>
      <p className="mt-1 text-sm text-muted">Plain-language briefs built from this platform&rsquo;s own APIs &mdash; buyers, costs, duties and incentives, with sources shown.</p>
      <div className="mt-5"><Suspense><AskPanel initialQ={searchParams.q ?? ""} compact={false} /></Suspense></div>
    </div>
  );
}
