import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "./lib/auth";

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    // Let public assets and auth routes pass
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon.ico") ||
      pathname.startsWith("/favicon.png") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    const token = req.cookies.get(COOKIE_NAME)?.value;
    let session = null;
    if (token) {
      try {
        session = await verifySessionToken(token);
      } catch {
        session = null;
      }
    }

    if (!session) {
      // If request is to an API route, return 401 JSON instead of redirecting to HTML login page
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      // Redirect to login page
      const loginUrl = new URL("/login", req.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Middleware error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
