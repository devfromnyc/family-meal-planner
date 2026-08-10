"use client";

import { FormEvent, useEffect, useState } from "react";

type Profile = {
  name: string | null;
  email: string;
  defaultServings: number;
  likes: string[];
  dislikes: string[];
  allergies: string[];
  maxCookTimeMinutes: number | null;
  kitchenNotes: string | null;
};

function toLines(arr: string[]) {
  return (arr || []).join("\n");
}

function fromLines(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;
    setError("");
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        defaultServings: Number(fd.get("defaultServings") || 3),
        likes: fromLines(String(fd.get("likes") || "")),
        dislikes: fromLines(String(fd.get("dislikes") || "")),
        allergies: fromLines(String(fd.get("allergies") || "")),
        maxCookTimeMinutes: fd.get("maxCookTimeMinutes")
          ? Number(fd.get("maxCookTimeMinutes"))
          : null,
        kitchenNotes: fd.get("kitchenNotes") || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setProfile(data.profile);
    setMessage("Saved.");
  }

  if (!profile) {
    return <p className="text-sm text-[var(--muted)]">Loading settings…</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 fade-up">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Settings
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Likes, dislikes, allergies, and kitchen defaults for AI planning.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Household name</span>
          <input
            name="name"
            defaultValue={profile.name || ""}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2"
          />
        </label>
        <p className="text-sm text-[var(--muted)]">Email: {profile.email}</p>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Default servings</span>
          <input
            name="defaultServings"
            type="number"
            defaultValue={profile.defaultServings}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">
            Likes (one per line)
          </span>
          <textarea
            name="likes"
            defaultValue={toLines(profile.likes)}
            className="h-24 w-full rounded-xl border border-[var(--border)] px-3 py-2"
            placeholder="Tilapia"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">
            Dislikes (one per line)
          </span>
          <textarea
            name="dislikes"
            defaultValue={toLines(profile.dislikes)}
            className="h-24 w-full rounded-xl border border-[var(--border)] px-3 py-2"
            placeholder="Cucumbers"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">
            Allergies (one per line)
          </span>
          <textarea
            name="allergies"
            defaultValue={toLines(profile.allergies)}
            className="h-20 w-full rounded-xl border border-[var(--border)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">
            Max cook time (minutes, optional)
          </span>
          <input
            name="maxCookTimeMinutes"
            type="number"
            defaultValue={profile.maxCookTimeMinutes ?? ""}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Kitchen notes</span>
          <textarea
            name="kitchenNotes"
            defaultValue={profile.kitchenNotes || ""}
            className="h-20 w-full rounded-xl border border-[var(--border)] px-3 py-2"
            placeholder="Air fryer available, prefer one-pan meals…"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--olive)]">{message}</p> : null}
        <button
          type="submit"
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Save preferences
        </button>
      </form>
    </div>
  );
}
