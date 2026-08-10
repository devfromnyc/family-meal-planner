import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { mealDraftSchema } from "@/lib/mealSchema";
import { acceptDrafts } from "@/lib/planSlots";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const assignments = Array.isArray(body.assignments)
      ? body.assignments
      : [];

    const normalized = [];
    for (const item of assignments) {
      const draft = mealDraftSchema.parse(item.draft);
      normalized.push({
        date: String(item.date),
        mealType: String(item.mealType),
        draft,
      });
    }

    if (normalized.length === 0) {
      return NextResponse.json(
        { error: "assignments are required" },
        { status: 400 },
      );
    }

    const result = await acceptDrafts(session.userId, normalized);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Accept failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
