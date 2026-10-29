import MarketingHeader from "@/components/marketing-header";
import DocumentStudio from "@/components/document-studio";
export const metadata = { title: "Document studio" };
export default function Page({ searchParams }: { searchParams: { buyer?: string; hs?: string } }) {
  return (<><MarketingHeader /><DocumentStudio initialBuyer={Number(searchParams.buyer ?? 0)} initialHs={searchParams.hs ?? ""} /></>);
}
