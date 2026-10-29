import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import FtaChecker from "@/components/fta-checker";

export const metadata = { title: "FTA checker" };

export default function Page({ searchParams }: { searchParams: { hs?: string; cc?: string } }) {
  if (!currentUser()) redirect("/login?next=/app/fta");
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="serif text-2xl">FTA checker</h1>
      <p className="mt-1 text-sm text-muted">Preferential duty, certificate of origin steps and rules-of-origin warnings for India agreements.</p>
      <div className="mt-5"><FtaChecker initialHs={searchParams.hs ?? ""} initialCc={searchParams.cc ?? "US"} compact /></div>
    </div>
  );
}
