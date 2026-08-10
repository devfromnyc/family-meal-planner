import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  buildGroceryPreview,
  listGroceryLists,
  saveGroceryList,
} from "@/lib/grocery";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (start && end) {
    const preview = await buildGroceryPreview(session.userId, start, end);
    return NextResponse.json(preview);
  }

  const lists = await listGroceryLists(session.userId);
  return NextResponse.json({ lists });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const startDate = String(body.startDate ?? "");
    const endDate = String(body.endDate ?? "");
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 },
      );
    }
    const list = await saveGroceryList(session.userId, {
      startDate,
      endDate,
      title: typeof body.title === "string" ? body.title : undefined,
    });
    return NextResponse.json({ list });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save list";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
