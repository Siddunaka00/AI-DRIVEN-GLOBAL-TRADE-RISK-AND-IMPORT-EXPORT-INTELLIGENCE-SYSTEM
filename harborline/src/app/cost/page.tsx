import MarketingHeader from "@/components/marketing-header";
import CostCalculator from "@/components/cost-calculator";
export const metadata = { title: "Landed cost" };
export default function Page({ searchParams }: { searchParams: { hs?: string } }) {
  return (<><MarketingHeader /><CostCalculator initialHs={searchParams.hs ?? ""} /></>);
}
