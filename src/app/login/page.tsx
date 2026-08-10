"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthShell } from "@/components/AuthShell";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }
    router.push(search.get("from") || "/today");
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your shared household meal plan."
      footer={
        <>
          Need an account?{" "}
          <Link href="/signup" className="font-medium text-[var(--accent)]">
            Sign up
          </Link>
          {" · "}
          <Link
            href="/forgot-password"
            className="font-medium text-[var(--accent)]"
          >
            Forgot password
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
