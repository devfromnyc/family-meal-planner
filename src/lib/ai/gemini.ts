import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { withGeminiModel } from "../geminiModel";
import {
  SUGGEST_BATCH_SIZE,
  chunkTargets,
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

function assignDraftsToTargets(
  targets: SlotTarget[],
  drafts: MealDraft[],
): DraftAssignment[] {
  const used = new Set<number>();
  const assignments: DraftAssignment[] = [];

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    let draftIndex = drafts.findIndex(
      (d, idx) => !used.has(idx) && d.mealType === target.mealType,
    );
    if (draftIndex < 0) {
      draftIndex = drafts.findIndex((_, idx) => !used.has(idx));
    }
    if (draftIndex < 0) {
      draftIndex = Math.min(i, drafts.length - 1);
    }
    used.add(draftIndex);
    const draft = drafts[draftIndex];
    assignments.push({
      date: target.date,
      mealType: target.mealType,
      draft: { ...draft, mealType: target.mealType as MealDraft["mealType"] },
    });
  }

  return assignments;
}

async function generateDraftsForChunk(input: {
  targets: SlotTarget[];
  likes: string[];
  dislikes: string[];
  allergies: string[];
  defaultServings: number;
  maxCookTimeMinutes?: number | null;
  kitchenNotes?: string | null;
  recentMealTitles: string[];
  favoriteTitles: string[];
  thumbsUpTitles: string[];
  thumbsDownTitles: string[];
  userContext?: string;
}): Promise<MealDraft[]> {
  const prompt = buildMealPlanPrompt({
    likes: input.likes,
    dislikes: input.dislikes,
    allergies: input.allergies,
    defaultServings: input.defaultServings,
    maxCookTimeMinutes: input.maxCookTimeMinutes,
    kitchenNotes: input.kitchenNotes,
    recentMealTitles: input.recentMealTitles,
    favoriteTitles: input.favoriteTitles,
    thumbsUpTitles: input.thumbsUpTitles,
    thumbsDownTitles: input.thumbsDownTitles,
    userContext: input.userContext,
    targets: input.targets.map((t) => ({
      date: t.date,
      mealType: t.mealType,
    })),
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

  return validated.data.meals;
}

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

  const recentMealTitles = library.slice(0, 14).map((m) => m.title);
  const favoriteTitles = library.filter((m) => m.favorited).map((m) => m.title);
  const baseContext = {
    likes: profile.likes ?? [],
    dislikes: profile.dislikes ?? [],
    allergies: profile.allergies ?? [],
    defaultServings: profile.defaultServings,
    maxCookTimeMinutes: profile.maxCookTimeMinutes,
    kitchenNotes: profile.kitchenNotes,
    favoriteTitles,
    thumbsUpTitles,
    thumbsDownTitles,
    userContext: input.userContext,
  };

  const assignments: DraftAssignment[] = [];
  const plannedTitles = [...recentMealTitles];

  for (const chunk of chunkTargets(targets, SUGGEST_BATCH_SIZE)) {
    const drafts = await generateDraftsForChunk({
      ...baseContext,
      targets: chunk,
      recentMealTitles: plannedTitles.slice(0, 20),
    });
    const chunkAssignments = assignDraftsToTargets(chunk, drafts);
    assignments.push(...chunkAssignments);
    plannedTitles.unshift(...chunkAssignments.map((a) => a.draft.title));
  }

  return assignments;
}
