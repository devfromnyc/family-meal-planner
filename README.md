# Family Meal Planner

Shared household meal planner for breakfast, lunch, and dinner. One login for the whole family: save recipes, plan Today or a Monday–Sunday week, let Gemini draft toddler-friendly meals, then Accept or Reject. Built with Next.js, Tailwind, Neon Postgres + Drizzle, and Gemini.

Live: [family-meal-planner-hazel-beta.vercel.app](https://family-meal-planner-hazel-beta.vercel.app)

## Who it’s for

A household that wants less “what’s for dinner?” stress—especially with a toddler. Every AI suggestion is **toddler-friendly by default**. Preferences (likes, dislikes, allergies), favorites, and thumbs up/down feed the next draft.

## Features

| Area | What you can do |
| --- | --- |
| **Auth** | Email/password signup & login; bcrypt hashes in Neon; jose-signed cookie `family_meal_session`; password reset via Resend (or console-logged links locally) |
| **Settings** | Likes, dislikes, allergies, default servings, optional max cook time, kitchen notes |
| **Meals library** | Manual recipes + AI-accepted recipes; favorite; thumbs up/down after cooking (optional note) |
| **Today** | Three slots (B/L/D); lock; swap from library; suggest/replace with optional “feeling like…” context |
| **Week** | Mon–Sun grid; same lock/swap/AI flows; bulk plan skips **locked** slots |
| **AI drafts** | Nothing is saved until **Accept**; Reject discards the draft |
| **Grocery** | From the week: preview aggregated ingredients → save a checklist with check-offs |

## How the pieces relate

```
Browser (Today | Week | Meals | Grocery | Settings)
        │
        ▼
Next.js App Router + Route Handlers
  /api/auth/*   /api/meals/*   /api/plan/*   /api/ai/*   /api/grocery/*
        │
        ├──────────────────┐
        ▼                  ▼
 Neon (Drizzle)         Gemini
  profiles, meals,       day-sized batches
  plan_slots, ratings,   → draft JSON
  grocery_*              → Accept writes meals + slots
```

### Mental model

1. **`profiles`** — the household account and taste preferences.
2. **`meals`** — the recipe library (source of truth for ingredients/steps).
3. **`plan_slots`** — calendar cells: one row per `(user, date, mealType)` pointing at a meal (or empty). Locking is on the **slot**, not the meal.
4. **`meal_ratings`** — post-cook feedback that biases future Gemini prompts.
5. **AI** — reads profile + recent library + ratings + optional free-text context; returns drafts only. **Accept** creates/updates library meals and fills slots.
6. **`grocery_lists` / `grocery_list_items`** — snapshots built from planned meals for a date range (not live-linked after save).

### Typical flows

**Plan today / week**

```
Settings (tastes)
    → Suggest (Gemini drafts, batched ~3 slots / day)
    → Preview panel
    → Accept → meals rows + plan_slots filled
    → Lock keepers → bulk regenerate only fills unlocked slots
```

**After cooking**

```
Meals library → thumbs up/down (+ note)
    → stored in meal_ratings
    → next AI prompt prefers ups / avoids downs
```

**Grocery**

```
Week (filled slots)
    → Preview: aggregate ingredients
    → Save → grocery_lists + grocery_list_items
    → Grocery page: check off while shopping
```

Merge rules: same normalized name + same unit + parseable quantities → **sum**. Different units or non-numeric amounts stay **separate lines**, tagged with source meal titles. No automatic unit conversion.

## Database structure

Schema lives in `src/lib/schema.ts`. Push with `npm run db:push`.

| Table | Purpose | Notable columns |
| --- | --- | --- |
| **`profiles`** | Household login + preferences | `email`, `password_hash`, `default_servings`, `likes` / `dislikes` / `allergies` (JSON arrays), `max_cook_time_minutes`, `kitchen_notes` |
| **`password_reset_tokens`** | One-time reset | `user_id` → profiles, `token_hash`, `expires_at`, `used_at` |
| **`meals`** | Recipe library | `user_id`, `title`, `meal_type`, `ingredients` / `steps` (JSON), `skill_level`, `cook_time_minutes`, `servings`, `favorited`, `source` (`manual` \| `ai`) |
| **`meal_ratings`** | Cook feedback | `meal_id`, `rating` (`up` \| `down`), `note`, `cooked_at` |
| **`plan_slots`** | Calendar | Unique `(user_id, date, meal_type)`; `meal_id` (nullable, `ON DELETE SET NULL`); `locked` |
| **`grocery_lists`** | Saved shopping list | `title`, `start_date`, `end_date` |
| **`grocery_list_items`** | Lines on a list | `name`, `quantity`, `unit`, `meal_titles` (JSON), `checked`, `sort_order` |

Relationships (cascade deletes unless noted):

```
profiles
  ├── password_reset_tokens
  ├── meals
  │     └── meal_ratings
  ├── plan_slots ──meal_id──► meals  (set null if meal deleted)
  └── grocery_lists
        └── grocery_list_items
```

## App routes & APIs

### Pages

| Path | Role |
| --- | --- |
| `/` | Marketing landing |
| `/login`, `/signup`, `/forgot-password`, `/reset-password` | Auth |
| `/today` | Day plan |
| `/week` | Week plan + grocery preview entry |
| `/meals` | Library CRUD / favorite / rate |
| `/grocery`, `/grocery/[id]` | Saved lists + check-offs |
| `/settings` | Household preferences |

Middleware (`src/middleware.ts`) protects app routes; public auth pages and `/api/auth/*` stay open. Session cookie: `family_meal_session`.

### API surface

| Prefix | Role |
| --- | --- |
| `POST /api/auth/signup\|login\|logout` | Account session |
| `POST /api/auth/forgot-password\|reset-password` | Reset flow |
| `/api/meals`, `/api/meals/[id]`, `/api/meals/[id]/rate` | Library + ratings |
| `PUT /api/plan/slots` | Assign / clear / lock slots |
| `POST /api/ai/suggest` | Gemini drafts (batched; `maxDuration` 60s) |
| `POST /api/ai/accept` | Persist drafts into meals + slots |
| `/api/grocery`, `/api/grocery/[id]`, `…/items/[itemId]` | Preview, save, check, delete |

## AI behavior (Gemini)

- Prompt builder: `src/lib/ai/prompt.ts` (preferences, history, favorites, ratings, optional user context, target slots).
- Generation: `src/lib/ai/gemini.ts` — targets are chunked in batches of **3** (one day’s B/L/D) so week plans stay reliable under Vercel time limits.
- Model selection: `src/lib/geminiModel.ts` — default `gemini-3.1-flash-lite` with fallbacks; override via `GEMINI_MODEL`.
- Response validation: `src/lib/mealSchema.ts` (Zod). Coerces quirks Gemini often returns (numeric quantities, labels like `"Easy"` → `beginner`).

## Project layout (high level)

```
src/
  app/                 # App Router pages + API routes
  components/          # AiSuggestPanel, grocery UI, nav, …
  lib/
    schema.ts          # Drizzle tables
    auth.ts            # Cookie session
    meals.ts / planSlots.ts / grocery*.ts
    ai/                # Gemini + prompts
    mealSchema.ts      # Draft Zod schemas + slot helpers
docs/superpowers/      # Design specs & implementation plans
```

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript + Tailwind 4  
- **Neon** Postgres + **Drizzle** ORM  
- **Gemini** (`@google/generative-ai`)  
- **Auth:** bcryptjs + jose  
- **Email:** Resend (optional)  
- **Tests:** Vitest  
- **Deploy:** Vercel  

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Neon database

1. Create a project at [neon.tech](https://neon.tech)
2. Put the connection string in `.env.local` as `DATABASE_URL`
3. Push schema:

```bash
npm run db:push
```

### 3. Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon connection string |
| `AUTH_SECRET` | yes | Signs session cookies |
| `APP_URL` | yes | Base URL for reset emails (no trailing slash) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | yes | Gemini |
| `GEMINI_MODEL` | no | Override default model |
| `RESEND_API_KEY` / `EMAIL_FROM` | no | Password reset email; without them, reset links log server-side |

### 4. Run & test

```bash
npm run dev    # http://localhost:3000
npm test
```

## Deploy (Vercel)

1. Push to GitHub and import the project in Vercel  
2. Set the same env vars (`APP_URL` = production URL)  
3. Run `npm run db:push` once against the production Neon database  

## Docs

- Product design: [`docs/superpowers/specs/2026-08-10-family-meal-planner-design.md`](docs/superpowers/specs/2026-08-10-family-meal-planner-design.md)
- Grocery list design: [`docs/superpowers/specs/2026-08-11-grocery-list-design.md`](docs/superpowers/specs/2026-08-11-grocery-list-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-08-10-family-meal-planner.md`](docs/superpowers/plans/2026-08-10-family-meal-planner.md)
