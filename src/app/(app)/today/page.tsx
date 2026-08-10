"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AiSuggestPanel } from "@/components/AiSuggestPanel";
import { formatLocalDate } from "@/lib/dates";

type Slot = {
  id?: string;
  date: string;
  mealType: string;
  mealId: string | null;
  locked: boolean;
  mealTitle: string | null;
  cookTimeMinutes: number | null;
  skillLevel: string | null;
  servings: number | null;
};

const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export default function TodayPage() {
  const today = formatLocalDate(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [error, setError] = useState("");
  const [meals, setMeals] = useState<Array<{ id: string; title: string; mealType: string }>>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/plan/slots?start=${today}&end=${today}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
      return;
    }
    const byType = new Map(
      (data.slots as Slot[]).map((s) => [s.mealType, s]),
    );
    setSlots(
      MEAL_TYPES.map(
        (mealType) =>
          byType.get(mealType) || {
            date: today,
            mealType,
            mealId: null,
            locked: false,
            mealTitle: null,
            cookTimeMinutes: null,
            skillLevel: null,
            servings: null,
          },
      ),
    );
  }, [today]);

  useEffect(() => {
    load();
    fetch("/api/meals")
      .then((r) => r.json())
      .then((d) => setMeals(d.meals || []));
  }, [load]);

  async function toggleLock(slot: Slot) {
    await fetch("/api/plan/slots", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: slot.date,
        mealType: slot.mealType,
        locked: !slot.locked,
      }),
    });
    load();
  }

  async function swap(slot: Slot, mealId: string) {
    await fetch("/api/plan/slots", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: slot.date,
        mealType: slot.mealType,
        mealId: mealId || null,
      }),
    });
    load();
  }

  async function rate(mealId: string, rating: "up" | "down") {
    await fetch(`/api/meals/${mealId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
  }

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
          Today
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{today}</p>
      </div>

      <AiSuggestPanel
        label="Suggest meals for today"
        targets={slots.map((s) => ({
          date: s.date,
          mealType: s.mealType,
          locked: s.locked,
        }))}
        onAccepted={load}
      />

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4">
        {slots.map((slot) => (
          <article
            key={slot.mealType}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  {slot.mealType}
                </p>
                <h2 className="font-[family-name:var(--font-display)] text-xl">
                  {slot.mealTitle || "Not planned yet"}
                </h2>
                {slot.mealTitle ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {slot.skillLevel} · {slot.cookTimeMinutes} min ·{" "}
                    {slot.servings} servings
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => toggleLock(slot)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  slot.locked
                    ? "bg-[var(--olive-soft)] text-[var(--olive)]"
                    : "bg-[var(--surface-muted)] text-[var(--muted)]"
                }`}
              >
                {slot.locked ? "Locked" : "Lock"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {slot.mealId ? (
                <>
                  <Link
                    href={`/meals?focus=${slot.mealId}`}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium"
                  >
                    Open recipe
                  </Link>
                  <button
                    type="button"
                    onClick={() => rate(slot.mealId!, "up")}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs"
                  >
                    Thumbs up
                  </button>
                  <button
                    type="button"
                    onClick={() => rate(slot.mealId!, "down")}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs"
                  >
                    Thumbs down
                  </button>
                </>
              ) : null}
            </div>

            <div className="mt-3">
              <AiSuggestPanel
                label={`AI replace ${slot.mealType}`}
                targets={[
                  {
                    date: slot.date,
                    mealType: slot.mealType,
                    locked: false,
                  },
                ]}
                respectLocks={false}
                onAccepted={load}
              />
            </div>

            <label className="mt-3 block text-xs text-[var(--muted)]">
              Swap from library
              <select
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
                value={slot.mealId || ""}
                onChange={(e) => swap(slot, e.target.value)}
              >
                <option value="">— empty —</option>
                {meals
                  .filter((m) => m.mealType === slot.mealType)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
              </select>
            </label>
          </article>
        ))}
      </div>
    </div>
  );
}
