"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AiSuggestPanel } from "@/components/AiSuggestPanel";
import { GroceryPreviewPanel } from "@/components/GroceryPreviewPanel";
import {
  addDaysIso,
  formatLocalDate,
  parseLocalDate,
  startOfWeekMonday,
  weekDatesFromMonday,
} from "@/lib/dates";

type Slot = {
  date: string;
  mealType: string;
  mealId: string | null;
  locked: boolean;
  mealTitle: string | null;
  cookTimeMinutes: number | null;
  skillLevel: string | null;
};

const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export default function WeekPage() {
  const [weekStart, setWeekStart] = useState(() =>
    formatLocalDate(startOfWeekMonday(new Date())),
  );
  const dates = useMemo(
    () => weekDatesFromMonday(parseLocalDate(weekStart)),
    [weekStart],
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [meals, setMeals] = useState<Array<{ id: string; title: string; mealType: string }>>([]);

  const load = useCallback(async () => {
    const end = dates[6];
    const res = await fetch(`/api/plan/slots?start=${dates[0]}&end=${end}`);
    const data = await res.json();
    setSlots(data.slots || []);
  }, [dates]);

  useEffect(() => {
    load();
    fetch("/api/meals")
      .then((r) => r.json())
      .then((d) => setMeals(d.meals || []));
  }, [load]);

  function slotAt(date: string, mealType: string): Slot {
    return (
      slots.find((s) => s.date === date && s.mealType === mealType) || {
        date,
        mealType,
        mealId: null,
        locked: false,
        mealTitle: null,
        cookTimeMinutes: null,
        skillLevel: null,
      }
    );
  }

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

  const weekTargets = dates.flatMap((date) =>
    MEAL_TYPES.map((mealType) => {
      const s = slotAt(date, mealType);
      return { date, mealType, locked: s.locked };
    }),
  );

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            Week
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {dates[0]} → {dates[6]}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => setWeekStart(addDaysIso(weekStart, -7))}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() =>
              setWeekStart(formatLocalDate(startOfWeekMonday(new Date())))
            }
          >
            This week
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm"
            onClick={() => setWeekStart(addDaysIso(weekStart, 7))}
          >
            Next
          </button>
        </div>
      </div>

      <AiSuggestPanel
        label="Plan this week"
        targets={weekTargets}
        onAccepted={load}
      />

      <GroceryPreviewPanel startDate={dates[0]} endDate={dates[6]} />

      <div className="space-y-4">
        {dates.map((date) => (
          <section
            key={date}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-[family-name:var(--font-display)] text-xl">
                {date}
              </h2>
              <AiSuggestPanel
                label="Plan day"
                targets={MEAL_TYPES.map((mealType) => {
                  const s = slotAt(date, mealType);
                  return { date, mealType, locked: s.locked };
                })}
                onAccepted={load}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {MEAL_TYPES.map((mealType) => {
                const slot = slotAt(date, mealType);
                return (
                  <div
                    key={mealType}
                    className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase text-[var(--muted)]">
                          {mealType}
                        </p>
                        <p className="font-medium">
                          {slot.mealTitle || "—"}
                        </p>
                        {slot.mealTitle ? (
                          <p className="text-xs text-[var(--muted)]">
                            {slot.skillLevel} · {slot.cookTimeMinutes} min
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleLock(slot)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          slot.locked
                            ? "bg-[var(--olive-soft)] text-[var(--olive)]"
                            : "bg-[var(--surface-muted)] text-[var(--muted)]"
                        }`}
                      >
                        {slot.locked ? "Locked" : "Lock"}
                      </button>
                    </div>
                    {slot.mealId ? (
                      <Link
                        href={`/meals?focus=${slot.mealId}`}
                        className="mt-2 inline-block text-xs font-medium text-[var(--accent)]"
                      >
                        Recipe
                      </Link>
                    ) : null}
                    <select
                      className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs"
                      value={slot.mealId || ""}
                      onChange={(e) => swap(slot, e.target.value)}
                    >
                      <option value="">Swap…</option>
                      {meals
                        .filter((m) => m.mealType === mealType)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
