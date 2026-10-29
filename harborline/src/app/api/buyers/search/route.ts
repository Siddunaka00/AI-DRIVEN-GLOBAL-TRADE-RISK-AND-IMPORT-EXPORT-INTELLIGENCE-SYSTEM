import { NextResponse } from "next/server";
import { searchBuyers } from "@/lib/match";

// GET /api/buyers/search?q=cumin&country=US&type=importer&sort=match
export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = u.searchParams.get("q") ?? "";
  const f = {
    country: u.searchParams.get("country") ?? undefined,
    region: u.searchParams.get("region") ?? undefined,
    category: u.searchParams.get("category") ?? undefined,
    type: u.searchParams.get("type") ?? undefined,
    verified: u.searchParams.get("verified") === "1",
    hasEmail: u.searchParams.get("hasEmail") === "1",
    hasPhone: u.searchParams.get("hasPhone") === "1",
    hasLinkedIn: u.searchParams.get("hasLinkedIn") === "1",
  };
  const sort = (u.searchParams.get("sort") as any) || "match";
  try {
    const results = searchBuyers(q, f, sort);
    return NextResponse.json({ query: q, count: results.length, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Search failed." }, { status: 500 });
  }
}
