import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          Family Meal Planner
        </p>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-95"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto flex min-h-[75svh] max-w-5xl flex-col justify-center px-4 pb-16 pt-8">
        <div className="fade-up max-w-2xl">
          <p className="font-[family-name:var(--font-display)] text-5xl leading-[1.05] tracking-tight text-[var(--ink)] sm:text-6xl">
            Family Meal Planner
          </p>
          <h1 className="mt-5 text-xl font-medium leading-snug text-[var(--ink)] sm:text-2xl">
            Stop winging dinner. Plan a toddler-friendly week in minutes.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--muted)]">
            Breakfast, lunch, and dinner — saved recipes, favorites, and AI
            suggestions that learn what your household likes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Start planning
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)]"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
