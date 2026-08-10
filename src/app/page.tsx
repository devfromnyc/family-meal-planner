import Link from "next/link";
import Image from "next/image";

const features = [
  {
    title: "Plan the whole week",
    body: "Breakfast, lunch, and dinner across Monday–Sunday. Lock the meals you love so AI only fills the rest.",
    image: "/images/landing-feature-week.png",
    alt: "Weekly meal plan on a kitchen counter",
  },
  {
    title: "AI drafts you approve",
    body: "Tell it “feeling Italian” or leave it blank. Gemini suggests recipes with ingredients and steps — Accept saves them, Reject discards.",
    image: "/images/landing-feature-ai.png",
    alt: "Phone beside fresh dinner ingredients",
  },
  {
    title: "Suggest a meal today",
    body: "Need tonight sorted fast? Pull one meal or a full day from your tastes, history, and what’s already on the plan.",
    image: "/images/landing-feature-today.png",
    alt: "Morning kitchen with today’s meals ready",
  },
  {
    title: "Likes, dislikes & allergies",
    body: "Teach the household profile once — Tilapia yes, cucumbers no, allergies hard-blocked — so every suggestion respects your kitchen.",
    image: "/images/landing-feature-prefs.png",
    alt: "Kitchen notepad with food likes and dislikes",
  },
  {
    title: "Favorites & history",
    body: "Save recipes to your library, heart the keepers, thumbs-up after cooking, and swap any slot with a past meal you already trust.",
    image: "/images/landing-feature-favorites.png",
    alt: "Favorite recipe marked in a kitchen notebook",
  },
  {
    title: "Toddler-friendly by default",
    body: "Built for a household with a little one. Every AI suggestion aims for a plate the whole family can share.",
    image: "/images/landing-feature-toddler.png",
    alt: "Toddler-friendly family dinner plate",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white drop-shadow"
          >
            Family Meal Planner
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#features"
              className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10 sm:inline"
            >
              Features
            </a>
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src="/images/landing-hero.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/80 via-[var(--ink)]/40 to-[var(--ink)]/25" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20">
          <div className="max-w-2xl animate-[fadeUp_0.7s_ease]">
            <p className="font-[family-name:var(--font-display)] text-5xl leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
              Family Meal Planner
            </p>
            <h1 className="mt-4 max-w-xl text-xl font-medium leading-snug text-white/95 sm:text-2xl">
              Stop winging dinner. Plan a toddler-friendly week in minutes.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80">
              Breakfast, lunch, and dinner for your household — with AI that
              learns what you like, and recipes you can actually cook.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                Start planning
              </Link>
              <a
                href="#features"
                className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                See features
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            What you get
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
            From tonight’s dinner to a full week
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            Suggest a meal, plan a day, or draft the week — then lock, swap, and
            cook from a library that remembers your household.
          </p>
        </div>

        <div className="mt-14 space-y-16">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className={`grid items-center gap-8 md:grid-cols-2 md:gap-12 ${
                index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="animate-[fadeUp_0.5s_ease]">
                <h3 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]">
                  {feature.body}
                </p>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-lg)]">
                <Image
                  src={feature.image}
                  alt={feature.alt}
                  fill
                  className="object-cover transition duration-700 hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-3 md:gap-8">
          {[
            {
              step: "01",
              title: "Set your tastes",
              body: "Likes, dislikes, allergies, and kitchen notes — once — so suggestions fit your house.",
            },
            {
              step: "02",
              title: "Let AI draft",
              body: "Plan today or the week. Preview recipes, then Accept or Reject.",
            },
            {
              step: "03",
              title: "Cook & remember",
              body: "Lock keepers, swap from favorites, thumbs-up after dinner so next week gets smarter.",
            },
          ].map((item) => (
            <div key={item.step} className="animate-[fadeUp_0.45s_ease]">
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--accent)]">
                {item.step}
              </p>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-[var(--ink)] px-8 py-14 text-center sm:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(600px 280px at 20% 0%, rgba(196,92,38,0.5), transparent 60%), radial-gradient(500px 260px at 90% 100%, rgba(92,107,60,0.4), transparent 55%)",
            }}
          />
          <div className="relative">
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-white sm:text-5xl">
              Ready for a calmer week of meals
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/75">
              Create a free household account and keep recipes, favorites, and
              the week’s plan in one warm place — not a scramble every night.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            Family Meal Planner
          </p>
          <p className="text-sm text-[var(--muted)]">
            Toddler-friendly weeks, cooked with less chaos.
          </p>
        </div>
      </footer>
    </div>
  );
}
