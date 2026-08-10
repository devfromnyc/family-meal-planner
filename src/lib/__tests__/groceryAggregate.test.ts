import { describe, expect, it } from "vitest";
import {
  aggregateGroceryLines,
  formatQuantity,
  parseQuantity,
} from "../groceryAggregate";

describe("parseQuantity", () => {
  it("parses integers and decimals", () => {
    expect(parseQuantity("2")).toBe(2);
    expect(parseQuantity("2.5")).toBe(2.5);
  });

  it("parses fractions and mixed numbers", () => {
    expect(parseQuantity("1/2")).toBe(0.5);
    expect(parseQuantity("1 1/2")).toBe(1.5);
  });

  it("returns null for unparseable", () => {
    expect(parseQuantity("a handful")).toBeNull();
  });
});

describe("aggregateGroceryLines", () => {
  it("sums matching name and unit", () => {
    const lines = aggregateGroceryLines([
      { name: "Beef", quantity: "1", unit: "lb", mealTitle: "Tacos" },
      { name: "beef", quantity: "1", unit: "lbs", mealTitle: "Stew" },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe("2");
    expect(lines[0].unit).toBe("lb");
    expect(lines[0].mealTitles).toEqual(["Stew", "Tacos"]);
    expect(lines[0].merged).toBe(true);
  });

  it("keeps separate lines when units differ", () => {
    const lines = aggregateGroceryLines([
      { name: "Milk", quantity: "1", unit: "cup", mealTitle: "Pancakes" },
      { name: "Milk", quantity: "1", unit: "gallon", mealTitle: "Mac" },
    ]);
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => l.unit).sort()).toEqual(["cup", "gallon"]);
    expect(lines.every((l) => l.mealTitles.length === 1)).toBe(true);
  });

  it("keeps unparseable quantities as their own lines with meal tags", () => {
    const lines = aggregateGroceryLines([
      {
        name: "Herbs",
        quantity: "a handful",
        unit: "",
        mealTitle: "Soup",
      },
      { name: "Herbs", quantity: "1", unit: "bunch", mealTitle: "Salad" },
    ]);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const handful = lines.find((l) => l.quantity === "a handful");
    expect(handful?.mealTitles).toEqual(["Soup"]);
  });
});

describe("formatQuantity", () => {
  it("formats halves", () => {
    expect(formatQuantity(0.5)).toBe("1/2");
    expect(formatQuantity(1.5)).toBe("1 1/2");
  });
});
