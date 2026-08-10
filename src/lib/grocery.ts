import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import {
  aggregateGroceryLines,
  type GroceryLine,
  type SourcedIngredient,
} from "./groceryAggregate";
import { getDb } from "./db";
import type { Ingredient } from "./schema";
import { groceryListItems, groceryLists, meals, planSlots } from "./schema";

export async function buildGroceryPreview(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<{ lines: GroceryLine[]; mealCount: number }> {
  const db = getDb();
  const slots = await db
    .select({
      mealId: planSlots.mealId,
      mealTitle: meals.title,
      ingredients: meals.ingredients,
    })
    .from(planSlots)
    .innerJoin(meals, eq(planSlots.mealId, meals.id))
    .where(
      and(
        eq(planSlots.userId, userId),
        gte(planSlots.date, startDate),
        lte(planSlots.date, endDate),
      ),
    );

  const sourced: SourcedIngredient[] = [];
  const mealIds = new Set<string>();

  for (const slot of slots) {
    if (!slot.mealId) continue;
    mealIds.add(slot.mealId);
    const ings = (slot.ingredients || []) as Ingredient[];
    for (const ing of ings) {
      sourced.push({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        mealTitle: slot.mealTitle || "Meal",
      });
    }
  }

  return {
    lines: aggregateGroceryLines(sourced),
    mealCount: mealIds.size,
  };
}

export async function saveGroceryList(
  userId: string,
  input: { startDate: string; endDate: string; title?: string },
) {
  const preview = await buildGroceryPreview(
    userId,
    input.startDate,
    input.endDate,
  );
  if (preview.lines.length === 0) {
    throw new Error("No ingredients found for this week — plan some meals first");
  }

  const db = getDb();
  const title =
    input.title?.trim() ||
    `Grocery list ${input.startDate} → ${input.endDate}`;

  const [list] = await db
    .insert(groceryLists)
    .values({
      userId,
      title,
      startDate: input.startDate,
      endDate: input.endDate,
      updatedAt: new Date(),
    })
    .returning();

  if (preview.lines.length > 0) {
    await db.insert(groceryListItems).values(
      preview.lines.map((line, index) => ({
        listId: list.id,
        name: line.name,
        quantity: line.quantity,
        unit: line.unit,
        mealTitles: line.mealTitles,
        checked: false,
        sortOrder: index,
      })),
    );
  }

  return list;
}

export async function listGroceryLists(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(groceryLists)
    .where(eq(groceryLists.userId, userId))
    .orderBy(desc(groceryLists.createdAt));
}

export async function getGroceryList(userId: string, listId: string) {
  const db = getDb();
  const [list] = await db
    .select()
    .from(groceryLists)
    .where(and(eq(groceryLists.id, listId), eq(groceryLists.userId, userId)));
  if (!list) return null;

  const items = await db
    .select()
    .from(groceryListItems)
    .where(eq(groceryListItems.listId, listId))
    .orderBy(asc(groceryListItems.sortOrder));

  return { list, items };
}

export async function setGroceryItemChecked(
  userId: string,
  listId: string,
  itemId: string,
  checked: boolean,
) {
  const db = getDb();
  const [list] = await db
    .select()
    .from(groceryLists)
    .where(and(eq(groceryLists.id, listId), eq(groceryLists.userId, userId)));
  if (!list) throw new Error("List not found");

  const [item] = await db
    .update(groceryListItems)
    .set({ checked })
    .where(
      and(
        eq(groceryListItems.id, itemId),
        eq(groceryListItems.listId, listId),
      ),
    )
    .returning();

  if (!item) throw new Error("Item not found");
  await db
    .update(groceryLists)
    .set({ updatedAt: new Date() })
    .where(eq(groceryLists.id, listId));
  return item;
}

export async function deleteGroceryList(userId: string, listId: string) {
  const db = getDb();
  const [list] = await db
    .select()
    .from(groceryLists)
    .where(and(eq(groceryLists.id, listId), eq(groceryLists.userId, userId)));
  if (!list) throw new Error("List not found");
  await db.delete(groceryLists).where(eq(groceryLists.id, listId));
  return { ok: true as const };
}
