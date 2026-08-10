import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import type { Ingredient, MealType, SkillLevel } from "./schema";
import { mealRatings, meals, planSlots } from "./schema";

export async function listMeals(
  userId: string,
  filters?: {
    mealType?: string;
    favorited?: boolean;
    skillLevel?: string;
    q?: string;
  },
) {
  const db = getDb();
  const rows = await db
    .select()
    .from(meals)
    .where(eq(meals.userId, userId))
    .orderBy(desc(meals.updatedAt));

  return rows.filter((m) => {
    if (filters?.mealType && m.mealType !== filters.mealType) return false;
    if (filters?.favorited && !m.favorited) return false;
    if (filters?.skillLevel && m.skillLevel !== filters.skillLevel)
      return false;
    if (filters?.q) {
      const q = filters.q.toLowerCase();
      if (!m.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export async function getMeal(userId: string, mealId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
  return row ?? null;
}

export async function createMeal(
  userId: string,
  input: {
    title: string;
    mealType: MealType | string;
    description?: string;
    ingredients: Ingredient[];
    steps: string[];
    skillLevel: SkillLevel | string;
    cookTimeMinutes: number;
    servings: number;
    source?: string;
    favorited?: boolean;
  },
) {
  const db = getDb();
  const [created] = await db
    .insert(meals)
    .values({
      userId,
      title: input.title.trim(),
      mealType: input.mealType,
      description: input.description?.trim() || "",
      ingredients: input.ingredients,
      steps: input.steps,
      skillLevel: input.skillLevel,
      cookTimeMinutes: input.cookTimeMinutes,
      servings: input.servings,
      source: input.source ?? "manual",
      favorited: input.favorited ?? false,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export async function updateMeal(
  userId: string,
  mealId: string,
  updates: Partial<{
    title: string;
    mealType: string;
    description: string;
    ingredients: Ingredient[];
    steps: string[];
    skillLevel: string;
    cookTimeMinutes: number;
    servings: number;
    favorited: boolean;
  }>,
) {
  const db = getDb();
  const existing = await getMeal(userId, mealId);
  if (!existing) throw new Error("Meal not found");

  const [updated] = await db
    .update(meals)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
    .returning();
  return updated;
}

export async function deleteMeal(userId: string, mealId: string) {
  const db = getDb();
  const existing = await getMeal(userId, mealId);
  if (!existing) throw new Error("Meal not found");

  const future = await db
    .select()
    .from(planSlots)
    .where(and(eq(planSlots.userId, userId), eq(planSlots.mealId, mealId)));

  if (future.length > 0) {
    await db
      .update(planSlots)
      .set({ mealId: null, updatedAt: new Date() })
      .where(and(eq(planSlots.userId, userId), eq(planSlots.mealId, mealId)));
  }

  await db
    .delete(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
  return { ok: true as const, unlinkedSlots: future.length };
}

export async function rateMeal(
  userId: string,
  mealId: string,
  rating: "up" | "down",
  note?: string,
) {
  const meal = await getMeal(userId, mealId);
  if (!meal) throw new Error("Meal not found");
  const db = getDb();
  const [row] = await db
    .insert(mealRatings)
    .values({
      userId,
      mealId,
      rating,
      note: note?.trim() || null,
      cookedAt: new Date(),
    })
    .returning();
  return row;
}

export async function listRecentRatings(userId: string, limit = 20) {
  const db = getDb();
  return db
    .select()
    .from(mealRatings)
    .where(eq(mealRatings.userId, userId))
    .orderBy(desc(mealRatings.cookedAt))
    .limit(limit);
}
