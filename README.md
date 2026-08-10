# Family Meal Planner

Shared household meal planner for breakfast, lunch, and dinner. AI drafts toddler-friendly recipes with Gemini; you Accept or Reject. Built with Next.js, Tailwind, Neon Postgres + Drizzle.

## Features

- Email/password household accounts (passwords hashed in Neon)
- Password reset via email (Resend)
- Meal library (manual + AI), favorites, thumbs up/down after cooking
- Today + Week calendar slots with lock/pin (bulk AI skips locked slots)
- Swap slots from library history
- Settings: likes, dislikes, allergies, servings, max cook time, kitchen notes
- Gemini suggest/plan/replace with optional “feeling like…” context

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Neon database

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string into `.env.local` as `DATABASE_URL`
3. Push schema:

```bash
npm run db:push
```

### 3. Auth + AI env

- `AUTH_SECRET` — long random string
- `APP_URL` — e.g. `http://localhost:3000`
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key
- `RESEND_API_KEY` / `EMAIL_FROM` — optional for password reset emails (without Resend, reset links log to the server console)

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Tests

```bash
npm test
```

## Deploy (Vercel)

1. Push this repo to GitHub
2. Import in Vercel
3. Set the same env vars (`DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, Resend keys)
4. Run `npm run db:push` against production Neon (locally with production `DATABASE_URL`, or via drizzle in CI)

## Docs

- Design spec: `docs/superpowers/specs/2026-08-10-family-meal-planner-design.md`
- Implementation plan: `docs/superpowers/plans/2026-08-10-family-meal-planner.md`
