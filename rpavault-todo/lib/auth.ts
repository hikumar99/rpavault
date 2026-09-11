import { cookies } from "next/headers";

const SECRET_KEY = process.env.SESSION_SECRET || "rpavault-default-secret-key-must-be-long-enough-32";
export const COOKIE_NAME = "rpavault_session";

export interface SessionData {
  user: string;
  authenticated: boolean;
  expiresAt: number;
}

// Simple deterministic signature using Web Crypto HMAC-SHA256 (compatible with Edge and Node.js)
async function getCryptoKey() {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf-8");
}

export async function encryptSession(payload: { user: string }): Promise<string> {
  const data: SessionData = {
    user: payload.user,
    authenticated: true,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const json = JSON.stringify(data);
  const key = await getCryptoKey();
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(json));
  const sigB64 = Buffer.from(sig).toString("base64url");
  const dataB64 = base64UrlEncode(json);
  return `${dataB64}.${sigB64}`;
}

export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [dataB64, sigB64] = parts;
    const json = base64UrlDecode(dataB64);
    const data: SessionData = JSON.parse(json);

    if (Date.now() > data.expiresAt) return null;

    const key = await getCryptoKey();
    const enc = new TextEncoder();
    const sigBuf = Buffer.from(sigB64, "base64url");
    const valid = await crypto.subtle.verify("HMAC", key, sigBuf, enc.encode(json));
    return valid ? data : null;
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
