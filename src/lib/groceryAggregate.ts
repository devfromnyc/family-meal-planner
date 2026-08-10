import type { Ingredient } from "./schema";

export type SourcedIngredient = Ingredient & {
  mealTitle: string;
};

export type GroceryLine = {
  name: string;
  /** Display quantity (e.g. "2" or "1/2" or "a handful") */
  quantity: string;
  unit: string;
  /** Meals this line came from */
  mealTitles: string[];
  /** True when this line is a summed merge of matching units */
  merged: boolean;
};

function normalizeName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeUnit(unit?: string) {
  if (!unit) return "";
  let u = unit.trim().toLowerCase().replace(/\s+/g, " ");
  // Light plural fold for common units so "lb" and "lbs" merge
  const plurals: Record<string, string> = {
    lbs: "lb",
    pounds: "lb",
    pound: "lb",
    ozs: "oz",
    ounces: "oz",
    ounce: "oz",
    cups: "cup",
    tbsps: "tbsp",
    tablespoons: "tbsp",
    tablespoon: "tbsp",
    tsps: "tsp",
    teaspoons: "tsp",
    teaspoon: "tsp",
    cloves: "clove",
    cans: "can",
    packages: "package",
    pkgs: "package",
    eggs: "egg",
  };
  if (plurals[u]) return plurals[u];
  if (u.endsWith("s") && u.length > 2 && !u.endsWith("ss")) {
    const singular = u.slice(0, -1);
    if (plurals[u + "s"] === undefined && ["cup", "lb", "oz", "clove", "can", "egg"].includes(singular)) {
      return singular;
    }
  }
  return u;
}

/** Parse simple numeric quantities: 2, 2.5, 1/2, 1 1/2 */
export function parseQuantity(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const mixed = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[2]);
    const den = Number(mixed[3]);
    if (!den) return null;
    return whole + num / den;
  }
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const num = Number(frac[1]);
    const den = Number(frac[2]);
    if (!den) return null;
    return num / den;
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function formatQuantity(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Prefer simple fractions for common values
  const rounded = Math.round(n * 1000) / 1000;
  const fracMap: Record<string, string> = {
    "0.25": "1/4",
    "0.5": "1/2",
    "0.75": "3/4",
    "0.333": "1/3",
    "0.667": "2/3",
  };
  const whole = Math.floor(rounded);
  const rem = Math.round((rounded - whole) * 1000) / 1000;
  const remKey = String(rem);
  if (fracMap[remKey]) {
    return whole > 0 ? `${whole} ${fracMap[remKey]}` : fracMap[remKey];
  }
  return String(rounded);
}

function displayName(name: string) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Ingredient";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Aggregate ingredients for a grocery list.
 * Same name + same unit + numeric quantities → sum.
 * Otherwise keep separate lines with meal attribution.
 */
export function aggregateGroceryLines(
  ingredients: SourcedIngredient[],
): GroceryLine[] {
  type Bucket = {
    key: string;
    name: string;
    unit: string;
    amounts: number[];
    rawQuantities: string[];
    mealTitles: Set<string>;
    allNumeric: boolean;
  };

  const buckets = new Map<string, Bucket>();
  const leftovers: GroceryLine[] = [];

  for (const ing of ingredients) {
    const nameKey = normalizeName(ing.name);
    const unit = normalizeUnit(ing.unit);
    const qty = parseQuantity(ing.quantity);
    const key = `${nameKey}||${unit}`;

    if (qty === null) {
      leftovers.push({
        name: displayName(ing.name),
        quantity: ing.quantity.trim() || "—",
        unit: ing.unit?.trim() || "",
        mealTitles: [ing.mealTitle],
        merged: false,
      });
      continue;
    }

    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, {
        key,
        name: displayName(ing.name),
        unit,
        amounts: [qty],
        rawQuantities: [ing.quantity.trim()],
        mealTitles: new Set([ing.mealTitle]),
        allNumeric: true,
      });
    } else {
      existing.amounts.push(qty);
      existing.rawQuantities.push(ing.quantity.trim());
      existing.mealTitles.add(ing.mealTitle);
    }
  }

  const merged: GroceryLine[] = [];
  for (const b of buckets.values()) {
    const total = b.amounts.reduce((a, c) => a + c, 0);
    merged.push({
      name: b.name,
      quantity: formatQuantity(total),
      unit: b.unit,
      mealTitles: Array.from(b.mealTitles).sort(),
      merged: b.amounts.length > 1,
    });
  }

  // Unparseable / mismatched already handled: different units get different keys
  // so they stay separate automatically when units differ.

  const lines = [...merged, ...leftovers];
  lines.sort((a, b) => a.name.localeCompare(b.name) || a.unit.localeCompare(b.unit));
  return lines;
}
