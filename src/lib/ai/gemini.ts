import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { withGeminiModel } from "../geminiModel";
import {
  filterUnlockedTargets,
  mealDraftsResponseSchema,
  type MealDraft,
  type SlotTarget,
} from "../mealSchema";
import { listRecentRatings } from "../meals";
import { meals } from "../schema";
import { getProfileById } from "../users";
import {
  buildMealPlanPrompt,
  extractJson,
  type DraftAssignment,
} from "./prompt";

export async function generateMealDrafts(input: {
  userId: string;
  targets: SlotTarget[];
  userContext?: string;
  respectLocks?: boolean;
}): Promise<DraftAssignment[]> {
  const targets =
    input.respectLocks === false
      ? input.targets
      : filterUnlockedTargets(input.targets);

  if (targets.length === 0) {
    return [];
  }

  const profile = await getProfileById(input.userId);
  if (!profile) throw new Error("Profile not found");

  const db = getDb();
  const library = await db
    .select()
    .from(meals)
    .where(eq(meals.userId, input.userId))
    .orderBy(desc(meals.updatedAt))
    .limit(40);

  const ratings = await listRecentRatings(input.userId, 30);
  const mealById = new Map(library.map((m) => [m.id, m]));

  const thumbsUpTitles = ratings
    .filter((r) => r.rating === "up")
    .map((r) => mealById.get(r.mealId)?.title)
    .filter(Boolean) as string[];
  const thumbsDownTitles = ratings
    .filter((r) => r.rating === "down")
    .map((r) => mealById.get(r.mealId)?.title)
    .filter(Boolean) as string[];

  const prompt = buildMealPlanPrompt({
    likes: profile.likes ?? [],
    dislikes: profile.dislikes ?? [],
    allergies: profile.allergies ?? [],
    defaultServings: profile.defaultServings,
    maxCookTimeMinutes: profile.maxCookTimeMinutes,
    kitchenNotes: profile.kitchenNotes,
    recentMealTitles: library.slice(0, 14).map((m) => m.title),
    favoriteTitles: library.filter((m) => m.favorited).map((m) => m.title),
    thumbsUpTitles,
    thumbsDownTitles,
    userContext: input.userContext,
    targets: targets.map((t) => ({ date: t.date, mealType: t.mealType })),
  });

  const result = await withGeminiModel({}, async (model) =>
    model.generateContent(prompt),
  );
  const text = result.response.text();
  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch (error) {
    console.error("[ai] parse failure", text);
    throw new Error("Couldn't parse suggestion — try again");
  }

  const validated = mealDraftsResponseSchema.safeParse(
    Array.isArray(parsed) ? { meals: parsed } : parsed,
  );
  if (!validated.success) {
    console.error("[ai] zod failure", validated.error);
    throw new Error("Couldn't parse suggestion — try again");
  }

  const drafts = validated.data.meals;
  const assignments: DraftAssignment[] = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const draft: MealDraft =
      drafts.find((d) => d.mealType === target.mealType && !assignments.some((a) => a.draft === d)) ||
      drafts[Math.min(i, drafts.length - 1)];
    assignments.push({
      date: target.date,
      mealType: target.mealType,
      draft: { ...draft, mealType: target.mealType as MealDraft["mealType"] },
    });
  }

  return assignments;
}
