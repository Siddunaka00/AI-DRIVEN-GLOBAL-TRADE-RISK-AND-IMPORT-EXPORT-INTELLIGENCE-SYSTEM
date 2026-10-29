import { Suspense } from "react";
import MarketingHeader from "@/components/marketing-header";
import AskPanel from "@/components/ask-panel";
export const metadata = { title: "Ask TradeIQ" };
export default function Page({ searchParams }: { searchParams: { q?: string } }) {
  return (<><MarketingHeader /><Suspense><AskPanel initialQ={searchParams.q ?? ""} compact={false} /></Suspense></>);
}
