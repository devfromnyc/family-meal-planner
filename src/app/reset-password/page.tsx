"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthShell } from "@/components/AuthShell";

function ResetForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token") || "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Reset failed");
      return;
    }
    router.push("/login");
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use at least 8 characters."
      footer={
        <Link href="/login" className="font-medium text-[var(--accent)]">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">New password</span>
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
          disabled={loading || !token}
          className="w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
