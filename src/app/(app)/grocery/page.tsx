"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type List = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export default function GroceryIndexPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/grocery")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setLists(d.lists || []);
      });
  }, []);

  async function remove(id: string) {
    const res = await fetch(`/api/grocery/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Delete failed");
      return;
    }
    setLists((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Grocery lists
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Saved shopping snapshots from your week plans. Create a new one from
          the Week page.
        </p>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="space-y-3">
        {lists.map((list) => (
          <div
            key={list.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div>
              <Link
                href={`/grocery/${list.id}`}
                className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)] hover:text-[var(--accent)]"
              >
                {list.title}
              </Link>
              <p className="text-xs text-[var(--muted)]">
                {list.startDate} → {list.endDate}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/grocery/${list.id}`}
                className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                Open
              </Link>
              <button
                type="button"
                onClick={() => remove(list.id)}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {lists.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No saved lists yet.{" "}
            <Link href="/week" className="font-medium text-[var(--accent)]">
              Plan a week
            </Link>{" "}
            then create a grocery list.
          </p>
        ) : null}
      </div>
    </div>
  );
}
