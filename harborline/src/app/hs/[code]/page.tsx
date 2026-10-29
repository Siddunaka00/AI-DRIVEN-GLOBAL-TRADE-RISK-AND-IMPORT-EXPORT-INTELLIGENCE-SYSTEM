import MarketingHeader from "@/components/marketing-header";
import HsLookup from "@/components/hs-lookup";

export const metadata = { title: "HS lookup" };
export default function HsCodePage({ params }: { params: { code: string } }) {
  return (<><MarketingHeader /><HsLookup initialCode={params.code} /></>);
}
