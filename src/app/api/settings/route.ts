import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProfileById, updatePreferences } from "@/lib/users";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getProfileById(session.userId);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    profile: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      defaultServings: profile.defaultServings,
      likes: profile.likes,
      dislikes: profile.dislikes,
      allergies: profile.allergies,
      maxCookTimeMinutes: profile.maxCookTimeMinutes,
      kitchenNotes: profile.kitchenNotes,
    },
  });
}

export async function PUT(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const profile = await updatePreferences(session.userId, {
      name: body.name,
      defaultServings:
        body.defaultServings !== undefined
          ? Number(body.defaultServings)
          : undefined,
      likes: Array.isArray(body.likes) ? body.likes : undefined,
      dislikes: Array.isArray(body.dislikes) ? body.dislikes : undefined,
      allergies: Array.isArray(body.allergies) ? body.allergies : undefined,
      maxCookTimeMinutes:
        body.maxCookTimeMinutes === null || body.maxCookTimeMinutes === ""
          ? null
          : body.maxCookTimeMinutes !== undefined
            ? Number(body.maxCookTimeMinutes)
            : undefined,
      kitchenNotes:
        body.kitchenNotes !== undefined ? body.kitchenNotes : undefined,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
