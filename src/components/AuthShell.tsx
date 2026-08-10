import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden min-h-screen overflow-hidden bg-[var(--ink)] lg:block">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(600px 320px at 20% 10%, rgba(196,92,38,0.45), transparent 60%), radial-gradient(500px 280px at 90% 90%, rgba(92,107,60,0.4), transparent 55%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="font-[family-name:var(--font-display)] text-4xl text-white">
            Family Meal Planner
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
            Warm weeknight plans for your household — breakfast, lunch, and
            dinner, toddler-friendly by default.
          </p>
        </div>
      </div>

      <div className="flex min-h-screen flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-block font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] lg:hidden"
          >
            Family Meal Planner
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-[var(--muted)]">{footer}</div>
        </div>
      </div>
    </div>
  );
}
