import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import IncentiveFinder from "@/components/incentive-finder";

export const metadata = { title: "Incentives" };

export default function Page({ searchParams }: { searchParams: { hs?: string } }) {
  if (!currentUser()) redirect("/login?next=/app/incentives");
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="serif text-2xl">Export incentives</h1>
      <p className="mt-1 text-sm text-muted">RoDTEP, duty drawback and RoSCTL eligibility with claim paths. Rates are illustrative samples.</p>
      <div className="mt-5"><IncentiveFinder initialHs={searchParams.hs ?? ""} compact /></div>
    </div>
  );
}
