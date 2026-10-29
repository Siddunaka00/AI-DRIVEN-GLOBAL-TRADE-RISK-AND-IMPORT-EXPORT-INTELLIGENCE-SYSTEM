import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import HsLookup from "@/components/hs-lookup";

export const metadata = { title: "HS lookup" };

// Workspace HS lookup — same component & API as the public tool, URL-synced.
export default function Page({ searchParams }: { searchParams: { code?: string; q?: string } }) {
  if (!currentUser()) redirect("/login?next=/app/hs");
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="serif text-2xl">HS lookup</h1>
      <p className="mt-1 text-sm text-muted">Search by 8-digit ITC-HS code or plain product name. Rates are seeded sample values.</p>
      <div className="mt-5"><HsLookup initialCode={searchParams.code ?? searchParams.q ?? ""} compact /></div>
    </div>
  );
}
