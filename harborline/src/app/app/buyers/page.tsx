import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import BuyerExplorer from "@/components/buyer-explorer";

export const metadata = { title: "Find buyers" };

// Workspace buyer search — the same split view as the public page, but inside
// the rail shell. Unlock/save write real rows for the signed-in user.
export default function AppBuyersPage({ searchParams }: { searchParams: { q?: string } }) {
  if (!currentUser()) redirect("/login?next=%2Fapp%2Fbuyers");
  return <BuyerExplorer initialQ={searchParams.q ?? ""} workspace />;
}
