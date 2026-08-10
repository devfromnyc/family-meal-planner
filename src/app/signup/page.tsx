"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/AuthShell";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Signup failed");
      return;
    }
    router.push("/today");
    router.refresh();
  }

  return (
    <AuthShell
      title="Create household"
      subtitle="One shared account for your family's week of meals."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--accent)]">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Household name</span>
          <input
            name="name"
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            placeholder="The Acejas"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
