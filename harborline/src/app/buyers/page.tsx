import MarketingHeader from "@/components/marketing-header";
import BuyerExplorer from "@/components/buyer-explorer";

export const metadata = { title: "Find buyers" };

// Public buyer search — same split view as the workspace, full viewport under
// the marketing top bar. Unlock/save actions prompt sign-in where needed.
export default async function BuyersPage({ searchParams }: { searchParams: { q?: string } }) {
  return (
    <>
      <MarketingHeader />
      <BuyerExplorer initialQ={searchParams.q ?? ""} workspace={false} />
    </>
  );
}
