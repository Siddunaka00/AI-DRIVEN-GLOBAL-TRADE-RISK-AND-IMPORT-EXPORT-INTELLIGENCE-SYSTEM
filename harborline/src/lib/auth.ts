// Cookie-session auth helpers shared by route handlers and server components.
import { cookies } from "next/headers";
import { sessionUserId, getUserById, UserRow } from "./db";

export const SESSION_COOKIE = "hl_session";

export function getTokenFromRequest(req: Request): string | undefined {
  return req.headers.get("cookie")?.split(";").map(s => s.trim())
    .find(s => s.startsWith(SESSION_COOKIE + "="))?.split("=")[1];
}

export function currentUserFromRequest(req: Request): UserRow | null {
  const uid = sessionUserId(getTokenFromRequest(req));
  return uid === null ? null : getUserById(uid) ?? null;
}

export function currentUser(): UserRow | null {
  const uid = sessionUserId(cookies().get(SESSION_COOKIE)?.value);
  return uid === null ? null : getUserById(uid) ?? null;
}

export function unauthorized() {
  return Response.json({ error: "Sign in to continue." }, { status: 401 });
}
