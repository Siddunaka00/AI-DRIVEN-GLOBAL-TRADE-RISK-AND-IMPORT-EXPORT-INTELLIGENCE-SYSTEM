import { NextResponse } from "next/server";
import { currentUserFromRequest } from "@/lib/auth";

// GET /api/auth/me — live session identity for client chrome (real credits).
export async function GET(req: Request) {
  const user = currentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({
    id: user.id, email: user.email, fullName: user.full_name,
    company: user.company, plan: user.plan, credits: user.credits,
  });
}
