import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserRole } from "@/models/User";

const SESSION_COOKIE = "dialboard_session";
const alg = "HS256";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set. Add it to your .env.local file.");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const p = payload as unknown as SessionPayload;
    // Older cookies (issued before roles existed) have no role. Default to the
    // least-privileged role; such a user just needs to log out and back in.
    return { ...p, role: p.role === "manager" ? "manager" : "rep" };
  } catch {
    return null;
  }
}

/**
 * Guard for a route that any signed-in user may call. Returns the session, or a
 * ready-to-return 401 response under `error`.
 */
export async function requireUser(): Promise<
  { session: SessionPayload; error?: never } | { session?: never; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  return { session };
}

/**
 * Guard for a manager-only route. Returns the session, or a ready-to-return
 * 401/403 response under `error`.
 */
export async function requireManager(): Promise<
  { session: SessionPayload; error?: never } | { session?: never; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  if (session.role !== "manager") {
    return {
      error: NextResponse.json({ error: "Managers only." }, { status: 403 }),
    };
  }
  return { session };
}

export function roleLabel(role: string): string {
  return role === "manager" ? "Manager" : "Caller";
}

export { SESSION_COOKIE };
