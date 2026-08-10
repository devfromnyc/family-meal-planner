import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { setGroceryItemChecked } from "@/lib/grocery";

type Ctx = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, itemId } = await ctx.params;
  try {
    const body = await request.json();
    const item = await setGroceryItemChecked(
      session.userId,
      id,
      itemId,
      Boolean(body.checked),
    );
    return NextResponse.json({ item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
