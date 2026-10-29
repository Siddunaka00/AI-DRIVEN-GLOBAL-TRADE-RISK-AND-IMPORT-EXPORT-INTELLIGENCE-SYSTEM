import MarketingHeader from "@/components/marketing-header";
import HsLookup from "@/components/hs-lookup";

export const metadata = { title: "HS lookup" };
export default function HsPage({ searchParams }: { searchParams: { q?: string } }) {
  return (<><MarketingHeader /><HsLookup initialCode={searchParams.q ?? ""} /></>);
}
