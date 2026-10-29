import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import CostCalculator from "@/components/cost-calculator";

export const metadata = { title: "Landed cost" };

export default function Page({ searchParams }: { searchParams: { hs?: string } }) {
  if (!currentUser()) redirect("/login?next=/app/cost");
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="serif text-2xl">Landed cost</h1>
      <p className="mt-1 text-sm text-muted">Build-up from ex-works to landed cost, MFN vs FTA side by side. Save scenarios for reuse.</p>
      <div className="mt-5"><CostCalculator initialHs={searchParams.hs ?? ""} compact /></div>
    </div>
  );
}
