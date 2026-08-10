import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createMeal, listMeals } from "@/lib/meals";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const meals = await listMeals(session.userId, {
    mealType: searchParams.get("mealType") || undefined,
    favorited:
      searchParams.get("favorited") === "1" ||
      searchParams.get("favorited") === "true"
        ? true
        : undefined,
    skillLevel: searchParams.get("skillLevel") || undefined,
    q: searchParams.get("q") || undefined,
  });
  return NextResponse.json({ meals });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const meal = await createMeal(session.userId, {
      title: String(body.title ?? ""),
      mealType: String(body.mealType ?? "dinner"),
      description: String(body.description ?? ""),
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
      steps: Array.isArray(body.steps) ? body.steps : [],
      skillLevel: String(body.skillLevel ?? "beginner"),
      cookTimeMinutes: Number(body.cookTimeMinutes ?? 30),
      servings: Number(body.servings ?? 3),
      source: "manual",
      favorited: Boolean(body.favorited),
    });
    return NextResponse.json({ meal });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
