import MarketingHeader from "@/components/marketing-header";
import IncentiveFinder from "@/components/incentive-finder";
export const metadata = { title: "Incentives" };
export default function Page({ searchParams }: { searchParams: { hs?: string } }) {
  return (<><MarketingHeader /><IncentiveFinder initialHs={searchParams.hs ?? ""} /></>);
}
