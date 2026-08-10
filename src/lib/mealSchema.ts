import { z } from "zod";

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner"]);
export const skillLevelSchema = z.enum(["beginner", "intermediate", "hard"]);

export const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().min(1),
  unit: z.string().optional(),
});

export const mealDraftSchema = z.object({
  title: z.string().min(1),
  mealType: mealTypeSchema,
  description: z.string().optional().default(""),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(z.string().min(1)).min(1),
  skillLevel: skillLevelSchema,
  cookTimeMinutes: z.number().int().positive(),
  servings: z.number().int().positive(),
  whyItFits: z.string().optional().default(""),
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
