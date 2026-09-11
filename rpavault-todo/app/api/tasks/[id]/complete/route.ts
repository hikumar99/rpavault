import { NextRequest, NextResponse } from "next/server";
import { completeAndReschedule } from "@/lib/notion";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await completeAndReschedule(params.id);
    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
