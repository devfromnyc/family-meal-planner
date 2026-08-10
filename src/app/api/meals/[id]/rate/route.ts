import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { rateMeal } from "@/lib/meals";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = await request.json();
    const rating = body.rating === "down" ? "down" : "up";
    const row = await rateMeal(
      session.userId,
      id,
      rating,
      typeof body.note === "string" ? body.note : undefined,
    );
    return NextResponse.json({ rating: row });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Rate failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
