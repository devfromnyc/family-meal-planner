"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Item = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  mealTitles: string[];
  checked: boolean;
};

type List = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
};

export default function GroceryDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [list, setList] = useState<List | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/grocery/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Not found");
      return;
    }
    setList(data.list);
    setItems(data.items || []);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(item: Item) {
    const next = !item.checked;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: next } : i)),
    );
    const res = await fetch(`/api/grocery/${id}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: next }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Update failed");
      load();
    }
  }

  if (!list && !error) {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 fade-up">
      <div>
        <Link href="/grocery" className="text-sm text-[var(--accent)]">
          ← All lists
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          {list?.title || "Grocery list"}
        </h1>
        {list ? (
          <p className="text-sm text-[var(--muted)]">
            {list.startDate} → {list.endDate}
          </p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`rounded-2xl border border-[var(--border)] p-3 transition ${
              item.checked
                ? "bg-[var(--olive-soft)]/50 opacity-70"
                : "bg-[var(--surface)]"
            }`}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggle(item)}
                className="mt-1"
              />
              <span>
                <span
                  className={`block font-medium ${
                    item.checked ? "line-through" : ""
                  }`}
                >
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ""} {item.name}
                </span>
                <span className="block text-xs text-[var(--muted)]">
                  From: {(item.mealTitles || []).join(", ") || "—"}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
