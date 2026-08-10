"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email") }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Request failed");
      return;
    }
    setMessage(data.message);
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email a link if that account exists."
      footer={
        <Link href="/login" className="font-medium text-[var(--accent)]">
          Back to log in
        </Link>
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
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--olive)]">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
