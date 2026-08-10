import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateMealDrafts } from "@/lib/ai/gemini";
import type { SlotTarget } from "@/lib/mealSchema";

/** Week plans call Gemini in day-sized batches — allow enough time on Vercel. */
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userContext =
      typeof body.userContext === "string" ? body.userContext : "";
    const respectLocks = body.respectLocks !== false;
    const targets = (body.targets ?? []) as SlotTarget[];

    if (!Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json(
        { error: "targets are required" },
        { status: 400 },
      );
    }

    const drafts = await generateMealDrafts({
      userId: session.userId,
      targets,
      userContext,
      respectLocks,
    });

    return NextResponse.json({ ok: true, drafts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Suggestion failed";
    const status = message.includes("parse") ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
