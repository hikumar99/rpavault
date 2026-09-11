import { NextRequest, NextResponse } from "next/server";
import { searchDeepTasks } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    if (!query.trim()) {
      return NextResponse.json({ success: true, tasks: [] });
    }

    const tasks = await searchDeepTasks(query.trim());
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    console.error("Deep search error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
