import { cookies } from "next/headers";

import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

const SECRET_KEY = process.env.SESSION_SECRET || "rpavault-default-secret-key-must-be-long-enough-32";
export const COOKIE_NAME = "rpavault_session";

const encodedKey = new TextEncoder().encode(SECRET_KEY);

export interface SessionData {
  user: string;
  authenticated: boolean;
  expiresAt: number;
}

export async function encryptSession(payload: { user: string }): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return new SignJWT({ user: payload.user, authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    if (!token) return null;
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return {
      user: (payload.user as string) || "user",
      authenticated: true,
      expiresAt: (payload.exp ? payload.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
