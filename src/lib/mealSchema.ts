import { z } from "zod";

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner"]);
export const skillLevelSchema = z.enum(["beginner", "intermediate", "hard"]);

/** Gemini often returns quantity as a number; coerce to string. */
const quantitySchema = z.preprocess(
  (v) => (v == null ? v : String(v).trim()),
  z.string().min(1),
);

const unitSchema = z.preprocess(
  (v) => (v == null || v === "" ? undefined : String(v)),
  z.string().optional(),
);

/** Map common Gemini labels onto our enum. */
export function normalizeSkillLevel(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const key = value.trim().toLowerCase();
  const map: Record<string, "beginner" | "intermediate" | "hard"> = {
    beginner: "beginner",
    easy: "beginner",
    simple: "beginner",
    intermediate: "intermediate",
    medium: "intermediate",
    moderate: "intermediate",
    hard: "hard",
    difficult: "hard",
    advanced: "hard",
    expert: "hard",
  };
  return map[key] ?? key;
}

const normalizedSkillLevelSchema = z.preprocess(
  normalizeSkillLevel,
  skillLevelSchema,
);

export const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: quantitySchema,
  unit: unitSchema,
});

export const mealDraftSchema = z.object({
  title: z.string().min(1),
  mealType: mealTypeSchema,
  description: z.preprocess(
    (v) => (v == null ? "" : String(v)),
    z.string().optional().default(""),
  ),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(z.string().min(1)).min(1),
  skillLevel: normalizedSkillLevelSchema,
  cookTimeMinutes: z.coerce.number().int().positive(),
  servings: z.coerce.number().int().positive(),
  whyItFits: z.preprocess(
    (v) => (v == null ? "" : String(v)),
    z.string().optional().default(""),
  ),
});

export const mealDraftsResponseSchema = z.object({
  meals: z.array(mealDraftSchema).min(1),
});

export type MealDraft = z.infer<typeof mealDraftSchema>;

export type SlotTarget = {
  date: string;
  mealType: "breakfast" | "lunch" | "dinner";
  locked?: boolean;
};

/** Bulk AI regenerate only targets unlocked slots. */
export function filterUnlockedTargets(targets: SlotTarget[]): SlotTarget[] {
  return targets.filter((t) => !t.locked);
}

/** One day of B/L/D — keeps Gemini JSON small and reliable. */
export const SUGGEST_BATCH_SIZE = 3;

export function chunkTargets<T>(items: T[], size: number): T[][] {
  if (size < 1) throw new Error("chunk size must be >= 1");
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
