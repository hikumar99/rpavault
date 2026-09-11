import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const raw = session.user.toLowerCase();
  const displayName = raw === "shivani" ? "Shivani" : "Kumar";
  const role = raw === "admin" || raw === "kumar" ? "Admin Role" : "Member Role";

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    displayName,
    role,
  });
}
