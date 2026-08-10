import { describe, expect, it } from "vitest";
import { validatePassword } from "../password";
import {
  formatLocalDate,
  startOfWeekMonday,
  weekDatesFromMonday,
} from "../dates";
import {
  filterUnlockedTargets,
  mealDraftSchema,
  mealDraftsResponseSchema,
} from "../mealSchema";

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    expect(validatePassword("short")).toBe(
      "Password must be at least 8 characters",
    );
  });

  it("accepts long enough passwords", () => {
    expect(validatePassword("longenough")).toBeNull();
  });
});

describe("startOfWeekMonday", () => {
  it("returns Monday for a Wednesday", () => {
    const wed = new Date(2026, 7, 12); // Aug 12 2026 Wed
    const mon = startOfWeekMonday(wed);
    expect(formatLocalDate(mon)).toBe("2026-08-10");
    expect(weekDatesFromMonday(mon)).toEqual([
      "2026-08-10",
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
    ]);
  });

  it("treats Sunday as end of prior week starting Monday", () => {
    const sun = new Date(2026, 7, 16); // Aug 16 2026 Sun
    expect(formatLocalDate(startOfWeekMonday(sun))).toBe("2026-08-10");
  });
});

describe("filterUnlockedTargets", () => {
  it("skips locked slots", () => {
    const result = filterUnlockedTargets([
      { date: "2026-08-10", mealType: "breakfast", locked: true },
      { date: "2026-08-10", mealType: "lunch", locked: false },
      { date: "2026-08-10", mealType: "dinner" },
    ]);
    expect(result).toEqual([
      { date: "2026-08-10", mealType: "lunch", locked: false },
      { date: "2026-08-10", mealType: "dinner" },
    ]);
  });
});

describe("mealDraftSchema", () => {
  const valid = {
    title: "Soft scrambled eggs",
    mealType: "breakfast",
    ingredients: [{ name: "eggs", quantity: "4" }],
    steps: ["Whisk", "Cook gently"],
    skillLevel: "beginner",
    cookTimeMinutes: 15,
    servings: 3,
  };

  it("parses a valid draft", () => {
    const parsed = mealDraftSchema.parse(valid);
    expect(parsed.title).toBe("Soft scrambled eggs");
    expect(parsed.description).toBe("");
  });

  it("rejects missing ingredients", () => {
    expect(() =>
      mealDraftSchema.parse({ ...valid, ingredients: [] }),
    ).toThrow();
  });

  it("parses a meals wrapper", () => {
    const parsed = mealDraftsResponseSchema.parse({ meals: [valid] });
    expect(parsed.meals).toHaveLength(1);
  });
});
