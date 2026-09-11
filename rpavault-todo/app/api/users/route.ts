import { NextResponse } from "next/server";
import { listNotionUsers } from "@/lib/notion";

export async function GET() {
  try {
    const users = await listNotionUsers();
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
