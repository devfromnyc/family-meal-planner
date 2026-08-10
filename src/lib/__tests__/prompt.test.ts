import { describe, expect, it } from "vitest";
import { buildMealPlanPrompt, extractJson } from "../ai/prompt";

describe("buildMealPlanPrompt", () => {
  it("includes allergies, context, and toddler rule", () => {
    const prompt = buildMealPlanPrompt({
      likes: ["Tilapia"],
      dislikes: ["Cucumbers"],
      allergies: ["Peanuts"],
      defaultServings: 3,
      recentMealTitles: ["Pasta"],
      favoriteTitles: ["Tacos"],
      thumbsUpTitles: ["Soup"],
      thumbsDownTitles: ["Liver"],
      userContext: "feeling Italian",
      targets: [{ date: "2026-08-10", mealType: "dinner" }],
    });
    expect(prompt).toContain("toddler-friendly");
    expect(prompt).toContain("Peanuts");
    expect(prompt).toContain("feeling Italian");
    expect(prompt).toContain("Cucumbers");
  });
});

describe("extractJson", () => {
  it("parses fenced JSON", () => {
    const value = extractJson('```json\n{"meals":[{"title":"A"}]}\n```');
    expect(value).toEqual({ meals: [{ title: "A" }] });
  });
});
