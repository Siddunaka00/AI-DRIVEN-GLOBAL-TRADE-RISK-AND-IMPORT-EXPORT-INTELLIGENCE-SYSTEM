import MarketingHeader from "@/components/marketing-header";
import FtaChecker from "@/components/fta-checker";
export const metadata = { title: "FTA checker" };
export default function Page({ searchParams }: { searchParams: { hs?: string; country?: string } }) {
  return (<><MarketingHeader /><FtaChecker initialHs={searchParams.hs ?? ""} initialCc={searchParams.country ?? "US"} /></>);
}
