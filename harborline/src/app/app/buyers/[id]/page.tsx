import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import BuyerProfileView from "@/components/buyer-profile-view";

export const metadata = { title: "Buyer profile" };

// Workspace buyer profile (deep-linkable, survives refresh). Auth guard follows
// the established pattern; the shared view handles masking/unlock data itself.
export default function AppBuyerProfile({ params }: { params: { id: string } }) {
  const user = currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/app/buyers/${params.id}`)}`);
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link href="/app/buyers" className="btn-quiet -ml-2 text-xs">&#8592; Back to search</Link>
      <BuyerProfileView id={id} />
    </div>
  );
}
