import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { hashPassword } from "./password";
import { profiles } from "./schema";

export async function getProfileByEmail(email: string) {
  const db = getDb();
  const key = email.trim().toLowerCase();
  const [row] = await db.select().from(profiles).where(eq(profiles.email, key));
  return row ?? null;
}

export async function getProfileById(userId: string) {
  const db = getDb();
  const [row] = await db.select().from(profiles).where(eq(profiles.id, userId));
  return row ?? null;
}

export async function createUserAccount(input: {
  email: string;
  name: string;
  password: string;
}) {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  const existing = await getProfileByEmail(email);
  if (existing) {
    throw new Error("An account with that email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const [created] = await db
    .insert(profiles)
    .values({
      email,
      name: input.name.trim(),
      passwordHash,
      updatedAt: new Date(),
    })
    .returning();
  return created;
}

export type PreferenceUpdates = {
  name?: string | null;
  defaultServings?: number;
  likes?: string[];
  dislikes?: string[];
  allergies?: string[];
  maxCookTimeMinutes?: number | null;
  kitchenNotes?: string | null;
};

export async function updatePreferences(
  userId: string,
  updates: PreferenceUpdates,
) {
  const db = getDb();
  const [updated] = await db
    .update(profiles)
    .set({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.defaultServings !== undefined
        ? { defaultServings: updates.defaultServings }
        : {}),
      ...(updates.likes !== undefined ? { likes: updates.likes } : {}),
      ...(updates.dislikes !== undefined ? { dislikes: updates.dislikes } : {}),
      ...(updates.allergies !== undefined
        ? { allergies: updates.allergies }
        : {}),
      ...(updates.maxCookTimeMinutes !== undefined
        ? { maxCookTimeMinutes: updates.maxCookTimeMinutes }
        : {}),
      ...(updates.kitchenNotes !== undefined
        ? { kitchenNotes: updates.kitchenNotes }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();
  return updated;
}
