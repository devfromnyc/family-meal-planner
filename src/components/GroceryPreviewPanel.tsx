"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Line = {
  name: string;
  quantity: string;
  unit: string;
  mealTitles: string[];
  merged: boolean;
};

export function GroceryPreviewPanel({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [mealCount, setMealCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(
      `/api/grocery?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`,
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not build list");
      return;
    }
    setLines(data.lines || []);
    setMealCount(data.mealCount || 0);
    setOpen(true);
  }, [startDate, endDate]);

  useEffect(() => {
    setOpen(false);
    setLines([]);
  }, [startDate, endDate]);

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/grocery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save list");
      return;
    }
    router.push(`/grocery/${data.list.id}`);
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
            Grocery list
          </p>
          <p className="text-sm text-[var(--muted)]">
            Merge this week’s ingredients — matching units add up; different
            units stay separate with meal tags.
          </p>
        </div>
        <button
          type="button"
          onClick={loadPreview}
          disabled={loading}
          className="rounded-full bg-[var(--olive)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Building…" : "Create grocery list"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      {open ? (
        <div className="fade-up mt-4 space-y-3 border-t border-[var(--border)] pt-4">
          {lines.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No ingredients yet — plan some meals for this week first.
            </p>
          ) : (
            <>
              <p className="text-xs text-[var(--muted)]">
                Preview from {mealCount} meal{mealCount === 1 ? "" : "s"} ·{" "}
                {lines.length} line{lines.length === 1 ? "" : "s"}
              </p>
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {lines.map((line, i) => (
                  <li
                    key={`${line.name}-${line.unit}-${line.quantity}-${i}`}
                    className="rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2"
                  >
                    <p className="font-medium text-[var(--ink)]">
                      {line.quantity}
                      {line.unit ? ` ${line.unit}` : ""} {line.name}
                      {line.merged ? (
                        <span className="ml-2 text-xs font-normal text-[var(--olive)]">
                          combined
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      From: {line.mealTitles.join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || lines.length === 0}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save this list"}
                </button>
                <Link
                  href="/grocery"
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
                >
                  Saved lists
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
