import { NextResponse } from "next/server";
import { computeLandedCost } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const input = await req.json();
    const out = computeLandedCost(input);
    if ("error" in out) return NextResponse.json(out, { status: 400 });
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Calculation failed." }, { status: 500 });
  }
}
