"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Meal = {
  id: string;
  title: string;
  mealType: string;
  description: string;
  ingredients: Array<{ name: string; quantity: string; unit?: string }>;
  steps: string[];
  skillLevel: string;
  cookTimeMinutes: number;
  servings: number;
  favorited: boolean;
  source: string;
};

function MealsInner() {
  const search = useSearchParams();
  const focus = search.get("focus");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [q, setQ] = useState("");
  const [favoritedOnly, setFavoritedOnly] = useState(false);
  const [mealType, setMealType] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Meal | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (favoritedOnly) params.set("favorited", "1");
    if (mealType) params.set("mealType", mealType);
    const res = await fetch(`/api/meals?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
      return;
    }
    setMeals(data.meals || []);
  }, [q, favoritedOnly, mealType]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!focus || meals.length === 0) return;
    const m = meals.find((x) => x.id === focus);
    if (m) setSelected(m);
  }, [focus, meals]);

  async function toggleFavorite(meal: Meal) {
    await fetch(`/api/meals/${meal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorited: !meal.favorited }),
    });
    load();
  }

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const ingredients = String(fd.get("ingredients") || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [quantity, ...rest] = line.split(" ");
        return {
          quantity: quantity || "1",
          name: rest.join(" ") || line,
        };
      });
    const steps = String(fd.get("steps") || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        mealType: fd.get("mealType"),
        description: fd.get("description"),
        skillLevel: fd.get("skillLevel"),
        cookTimeMinutes: Number(fd.get("cookTimeMinutes") || 30),
        servings: Number(fd.get("servings") || 3),
        ingredients,
        steps,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Create failed");
      return;
    }
    e.currentTarget.reset();
    load();
  }

  const list = useMemo(() => meals, [meals]);

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Meals
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Your household cookbook — history, favorites, and manual recipes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={favoritedOnly}
            onChange={(e) => setFavoritedOnly(e.target.checked)}
          />
          Favorites only
        </label>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {list.map((meal) => (
            <button
              key={meal.id}
              type="button"
              onClick={() => setSelected(meal)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selected?.id === meal.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase text-[var(--muted)]">
                    {meal.mealType}
                  </p>
                  <p className="font-[family-name:var(--font-display)] text-lg">
                    {meal.title}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {meal.skillLevel} · {meal.cookTimeMinutes} min ·{" "}
                    {meal.servings} servings
                  </p>
                </div>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(meal);
                  }}
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    meal.favorited
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface-muted)] text-[var(--muted)]"
                  }`}
                >
                  {meal.favorited ? "★" : "☆"}
                </span>
              </div>
            </button>
          ))}
          {list.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No meals yet.</p>
          ) : null}
        </div>

        <div className="space-y-4">
          {selected ? (
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                {selected.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {selected.description}
              </p>
              <h3 className="mt-4 text-sm font-semibold">Ingredients</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                {selected.ingredients.map((ing, i) => (
                  <li key={i}>
                    {ing.quantity}
                    {ing.unit ? ` ${ing.unit}` : ""} {ing.name}
                  </li>
                ))}
              </ul>
              <h3 className="mt-4 text-sm font-semibold">Steps</h3>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
                {selected.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </article>
          ) : null}

          <form
            onSubmit={onCreate}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3"
          >
            <h2 className="font-[family-name:var(--font-display)] text-xl">
              Add a meal
            </h2>
            <input
              name="title"
              required
              placeholder="Title"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <select
              name="mealType"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
              defaultValue="dinner"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
            <input
              name="description"
              placeholder="Short description"
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                name="skillLevel"
                className="rounded-xl border border-[var(--border)] px-2 py-2 text-sm"
                defaultValue="beginner"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="hard">Hard</option>
              </select>
              <input
                name="cookTimeMinutes"
                type="number"
                defaultValue={30}
                className="rounded-xl border border-[var(--border)] px-2 py-2 text-sm"
              />
              <input
                name="servings"
                type="number"
                defaultValue={3}
                className="rounded-xl border border-[var(--border)] px-2 py-2 text-sm"
              />
            </div>
            <textarea
              name="ingredients"
              required
              placeholder={"Ingredients (one per line)\n2 eggs\n1 cup milk"}
              className="h-24 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <textarea
              name="steps"
              required
              placeholder="Steps (one per line)"
              className="h-24 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Save meal
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MealsPage() {
  return (
    <Suspense>
      <MealsInner />
    </Suspense>
  );
}
