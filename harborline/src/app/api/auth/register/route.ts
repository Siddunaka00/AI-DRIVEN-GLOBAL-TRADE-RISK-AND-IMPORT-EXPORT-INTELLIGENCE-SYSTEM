import { NextResponse } from "next/server";
import { z } from "zod";
import { createUser, findUserByEmail, createSession, log } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

const schema = z.object({ email: z.string().email(), password: z.string().min(8), fullName: z.string().min(2), company: z.string().optional() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Check email, name and an 8+ character password." }, { status: 400 });
    const { email, password, fullName, company } = parsed.data;
    if (findUserByEmail(email)) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const id = createUser({ email, password, fullName, company });
    const token = createSession(id);
    log(id, "register", email);
    const res = NextResponse.json({ ok: true, userId: id });
    res.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Registration failed." }, { status: 500 });
  }
}
