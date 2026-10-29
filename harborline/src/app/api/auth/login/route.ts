import { NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, createSession, log } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = findUserByEmail(String(email ?? "").toLowerCase());
    if (!user || !verifyPassword(String(password ?? ""), user.password_hash)) {
      return NextResponse.json({ error: "Wrong email or password. Try demo@harborline.test / harborline" }, { status: 401 });
    }
    const token = createSession(user.id);
    log(user.id, "login");
    const res = NextResponse.json({ ok: true, plan: user.plan, credits: user.credits });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Login failed." }, { status: 500 });
  }
}
