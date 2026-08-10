"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/today", label: "Today" },
  { href: "/week", label: "Week" },
  { href: "/meals", label: "Meals" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--paper)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/today"
          className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)] sm:text-xl"
        >
          Family Meal Planner
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-muted)]"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
