import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSlotsForRange, setSlotLocked, upsertSlot } from "@/lib/planSlots";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end are required" },
      { status: 400 },
    );
  }
  const slots = await getSlotsForRange(session.userId, start, end);
  return NextResponse.json({ slots });
}

export async function PUT(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (typeof body.locked === "boolean" && body.mealId === undefined) {
      const slot = await setSlotLocked(
        session.userId,
        String(body.date),
        String(body.mealType),
        body.locked,
      );
      return NextResponse.json({ slot });
    }
    const slot = await upsertSlot(session.userId, {
      date: String(body.date),
      mealType: String(body.mealType),
      mealId: body.mealId === undefined ? undefined : body.mealId,
      locked: typeof body.locked === "boolean" ? body.locked : undefined,
    });
    return NextResponse.json({ slot });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
