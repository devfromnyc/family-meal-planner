import type { MealDraft } from "../mealSchema";

export type AiContext = {
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
  targets: Array<{ date: string; mealType: string }>;
};

export function buildMealPlanPrompt(ctx: AiContext): string {
  const lines = [
    "You are a family meal planning assistant.",
    "Every meal MUST be toddler-friendly (suitable for a 3-year-old) by default.",
    "Use US customary units for ingredients.",
    "Return ONLY valid JSON with shape: {\"meals\":[{...}]}",
    "Each meal object fields: title, mealType (breakfast|lunch|dinner), description, ingredients([{name,quantity as string,unit?}]), steps([string]), skillLevel (beginner|intermediate|hard only — never Easy/Medium), cookTimeMinutes (number), servings (number), whyItFits (string).",
    "Important: quantity must be a JSON string (e.g. \"4\" or \"1/2\"), never a bare number. skillLevel must be exactly beginner, intermediate, or hard.",
    `Default servings: ${ctx.defaultServings}`,
    `Likes: ${ctx.likes.join(", ") || "(none)"}`,
    `Dislikes: ${ctx.dislikes.join(", ") || "(none)"}`,
    `Allergies (hard avoid): ${ctx.allergies.join(", ") || "(none)"}`,
    ctx.maxCookTimeMinutes
      ? `Prefer cook time under ${ctx.maxCookTimeMinutes} minutes when possible.`
      : "",
    ctx.kitchenNotes ? `Kitchen notes: ${ctx.kitchenNotes}` : "",
    `Recent planned meals to avoid repeating soon: ${ctx.recentMealTitles.join(", ") || "(none)"}`,
    `Prefer favorites: ${ctx.favoriteTitles.join(", ") || "(none)"}`,
    `Prefer thumbs-up meals: ${ctx.thumbsUpTitles.join(", ") || "(none)"}`,
    `Avoid thumbs-down meals: ${ctx.thumbsDownTitles.join(", ") || "(none)"}`,
    ctx.userContext?.trim()
      ? `Extra context from the household for this request: ${ctx.userContext.trim()}`
      : "No extra context provided — use history and preferences.",
    "Generate exactly one meal per target slot below. Match mealType for each target.",
    "Targets:",
    ...ctx.targets.map((t) => `- ${t.date} ${t.mealType}`),
  ];
  return lines.filter(Boolean).join("\n");
}

export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json\s*/gi, "```").replace(/```/g, "");
  const startObj = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  let start = -1;
  if (startObj >= 0 && (startArr < 0 || startObj < startArr)) start = startObj;
  else start = startArr;
  if (start < 0) throw new Error("No JSON found in model response");
  const slice = cleaned.slice(start);
  const endObj = slice.lastIndexOf("}");
  const endArr = slice.lastIndexOf("]");
  const end = Math.max(endObj, endArr);
  if (end < 0) throw new Error("Incomplete JSON in model response");
  return JSON.parse(slice.slice(0, end + 1));
}

export type DraftAssignment = {
  date: string;
  mealType: string;
  draft: MealDraft;
};
