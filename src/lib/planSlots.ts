import { and, eq, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { createMeal } from "./meals";
import type { MealDraft } from "./mealSchema";
import { meals, planSlots } from "./schema";

export async function getSlotsForRange(
  userId: string,
  startDate: string,
  endDate: string,
) {
  const db = getDb();
  const slots = await db
    .select({
      id: planSlots.id,
      date: planSlots.date,
      mealType: planSlots.mealType,
      mealId: planSlots.mealId,
      locked: planSlots.locked,
      mealTitle: meals.title,
      cookTimeMinutes: meals.cookTimeMinutes,
      skillLevel: meals.skillLevel,
      servings: meals.servings,
      favorited: meals.favorited,
    })
    .from(planSlots)
    .leftJoin(meals, eq(planSlots.mealId, meals.id))
    .where(
      and(
        eq(planSlots.userId, userId),
        gte(planSlots.date, startDate),
        lte(planSlots.date, endDate),
      ),
    );
  return slots;
}

export async function upsertSlot(
  userId: string,
  input: {
    date: string;
    mealType: string;
    mealId?: string | null;
    locked?: boolean;
  },
) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(planSlots)
    .where(
      and(
        eq(planSlots.userId, userId),
        eq(planSlots.date, input.date),
        eq(planSlots.mealType, input.mealType),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(planSlots)
      .set({
        mealId: input.mealId === undefined ? existing.mealId : input.mealId,
        locked: input.locked ?? existing.locked,
        updatedAt: new Date(),
      })
      .where(eq(planSlots.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(planSlots)
    .values({
      userId,
      date: input.date,
      mealType: input.mealType,
      mealId: input.mealId ?? null,
      locked: input.locked ?? false,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function setSlotLocked(
  userId: string,
  date: string,
  mealType: string,
  locked: boolean,
) {
  return upsertSlot(userId, { date, mealType, locked });
}

export async function acceptDrafts(
  userId: string,
  assignments: Array<{ date: string; mealType: string; draft: MealDraft }>,
) {
  const db = getDb();
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const item of assignments) {
    const [existing] = await db
      .select()
      .from(planSlots)
      .where(
        and(
          eq(planSlots.userId, userId),
          eq(planSlots.date, item.date),
          eq(planSlots.mealType, item.mealType),
        ),
      );

    if (existing?.locked) {
      skipped.push(`${item.date}:${item.mealType}`);
      continue;
    }

    const meal = await createMeal(userId, {
      title: item.draft.title,
      mealType: item.draft.mealType,
      description: item.draft.description || item.draft.whyItFits || "",
      ingredients: item.draft.ingredients,
      steps: item.draft.steps,
      skillLevel: item.draft.skillLevel,
      cookTimeMinutes: item.draft.cookTimeMinutes,
      servings: item.draft.servings,
      source: "ai",
    });

    await upsertSlot(userId, {
      date: item.date,
      mealType: item.mealType,
      mealId: meal.id,
    });
    applied.push(`${item.date}:${item.mealType}`);
  }

  return { applied, skipped };
}
