import { NextRequest, NextResponse } from "next/server";
import { getTaskComments, createTaskComment } from "@/lib/notion";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await getTaskComments(params.id);
    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { text, taggedUserIds, authorName } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: "Comment text required" }, { status: 400 });
    }

    const comment = await createTaskComment(
      params.id,
      text.trim(),
      taggedUserIds || [],
      authorName || "Kumar"
    );
    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
