import { NextRequest, NextResponse } from "next/server";
import { listTasks, createTask } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const tasks = await listTasks();
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    console.error("Failed to list Notion tasks:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch tasks from Notion",
        isNotionError: true,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = await createTask(body);
    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("Failed to create Notion task:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
