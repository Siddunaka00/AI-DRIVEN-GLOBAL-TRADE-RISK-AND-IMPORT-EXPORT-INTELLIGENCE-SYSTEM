import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingHeader, { MarketingFooter } from "@/components/marketing-header";
import BuyerProfileView from "@/components/buyer-profile-view";

export const metadata = { title: "Buyer profile" };

// Public, shareable buyer profile. Same data path as the workspace route and
// GET /api/buyers/[id]: contacts stay masked unless the signed-in user holds
// an unlock row (BuyerProfileView resolves currentUser() itself).
export default function BuyerPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/buyers" className="btn-quiet mb-4 !px-0 text-sm">&#8592; Back to search</Link>
        <BuyerProfileView id={id} />
      </main>
      <MarketingFooter />
    </>
  );
}
