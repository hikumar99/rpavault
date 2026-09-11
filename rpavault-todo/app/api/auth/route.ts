import { NextRequest, NextResponse } from "next/server";
import { encryptSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const cleanUser = (username || "").trim().toLowerCase();

    // Default admin / Kumar account
    const expectedAdminUser = (process.env.AUTH_USERNAME || "admin").toLowerCase();
    const expectedAdminPass = process.env.AUTH_PASSWORD || "rpavault";

    // Shivani account
    const expectedShivaniUser = (process.env.SHIVANI_USERNAME || "shivani").toLowerCase();
    const expectedShivaniPass = process.env.SHIVANI_PASSWORD || "rpavault123";

    let authenticatedUser: string | null = null;

    if (
      (cleanUser === expectedAdminUser || cleanUser === "kumar") &&
      password === expectedAdminPass
    ) {
      authenticatedUser = "Kumar";
    } else if (cleanUser === expectedShivaniUser && password === expectedShivaniPass) {
      authenticatedUser = "Shivani";
    }

    if (authenticatedUser) {
      const token = await encryptSession({ user: authenticatedUser });
      const response = NextResponse.json({ success: true, user: authenticatedUser });
      
      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });
  return response;
}
