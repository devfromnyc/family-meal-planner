"use client";

import { useMemo, useState } from "react";

export type DraftItem = {
  date: string;
  mealType: string;
  draft: {
    title: string;
    mealType: string;
    description?: string;
    ingredients: Array<{ name: string; quantity: string; unit?: string }>;
    steps: string[];
    skillLevel: string;
    cookTimeMinutes: number;
    servings: number;
    whyItFits?: string;
  };
};

export function AiSuggestPanel({
  label,
  targets,
  respectLocks = true,
  onAccepted,
}: {
  label: string;
  targets: Array<{ date: string; mealType: string; locked?: boolean }>;
  respectLocks?: boolean;
  onAccepted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  const unlockedCount = useMemo(
    () =>
      respectLocks
        ? targets.filter((t) => !t.locked).length
        : targets.length,
    [targets, respectLocks],
  );

  async function suggest() {
    setError("");
    setLoading(true);
    setDrafts([]);
    const res = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targets,
        userContext: context,
        respectLocks,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Suggestion failed");
      return;
    }
    setDrafts(data.drafts || []);
    setOpen(true);
  }

  async function accept() {
    setAccepting(true);
    setError("");
    const res = await fetch("/api/ai/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignments: drafts }),
    });
    const data = await res.json();
    setAccepting(false);
    if (!res.ok) {
      setError(data.error || "Accept failed");
      return;
    }
    if (data.skipped?.length) {
      setError(
        `Accepted ${data.applied?.length || 0}; skipped locked: ${data.skipped.join(", ")}`,
      );
    }
    setDrafts([]);
    setOpen(false);
    onAccepted();
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block text-[var(--muted)]">
            Optional context (“This week I’m feeling like…”)
          </span>
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2"
            placeholder="Italian-ish, quick after work…"
          />
        </label>
        <button
          type="button"
          onClick={suggest}
          disabled={loading || unlockedCount === 0}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Thinking…" : label}
        </button>
      </div>
      {unlockedCount === 0 ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          All target slots are locked — unlock some, or replace a single slot.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      {open && drafts.length > 0 ? (
        <div className="fade-up mt-4 space-y-3 border-t border-[var(--border)] pt-4">
          <p className="text-sm font-medium text-[var(--ink)]">
            Draft preview — Accept to save, or Reject to discard.
          </p>
          {drafts.map((d) => (
            <div
              key={`${d.date}-${d.mealType}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--paper)] p-3"
            >
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {d.date} · {d.mealType}
              </p>
              <p className="font-[family-name:var(--font-display)] text-lg">
                {d.draft.title}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {d.draft.skillLevel} · {d.draft.cookTimeMinutes} min ·{" "}
                {d.draft.servings} servings
              </p>
              {d.draft.whyItFits ? (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {d.draft.whyItFits}
                </p>
              ) : null}
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={accepting}
              onClick={accept}
              className="rounded-full bg-[var(--olive)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {accepting ? "Saving…" : "Accept"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDrafts([]);
                setOpen(false);
              }}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Reject
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
