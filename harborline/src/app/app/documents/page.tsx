import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import DocumentStudio from "@/components/document-studio";

export const metadata = { title: "Document studio" };

export default function Page({ searchParams }: { searchParams: { buyer?: string; hs?: string } }) {
  if (!currentUser()) redirect("/login?next=/app/documents");
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="serif text-2xl">Document studio</h1>
      <p className="mt-1 text-sm text-muted">Draft proforma invoices, commercial invoices, packing lists and quotations. Drafts save to your account and print to PDF.</p>
      <div className="mt-5"><DocumentStudio initialBuyer={Number(searchParams.buyer ?? 0)} initialHs={searchParams.hs ?? ""} compact /></div>
    </div>
  );
}
