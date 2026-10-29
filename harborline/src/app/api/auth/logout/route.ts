import { NextResponse } from "next/server";
import { destroySession } from "@/lib/db";
import { getTokenFromRequest, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  destroySession(getTokenFromRequest(req));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
