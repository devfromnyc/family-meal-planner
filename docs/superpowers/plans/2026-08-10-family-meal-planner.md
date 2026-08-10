# Family Meal Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a household meal planner (auth, meal library, Today/Week calendar with locks, Gemini draft→accept) per `docs/superpowers/specs/2026-08-10-family-meal-planner-design.md`.

**Architecture:** Next.js App Router + Drizzle/Neon. Calendar slots point at a meal library. AI returns Zod-validated drafts; Accept writes meals + unlocked slots only.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind 4, Neon, Drizzle, jose, bcryptjs, Resend, Gemini (`@google/generative-ai`), Zod, Vitest.

## Global Constraints

- Toddler-friendly meals by default; B/L/D; week starts Monday; default servings 3; US units.
- One shared household account; cookie `family_meal_session`.
- Sibling theme: paper/ink + clay/olive accents; Fraunces + Outfit; no purple/neon tech look.
- No grocery list, multi-user, recipe images, or live Gemini in CI.
- Reimplement bucket-list auth/Gemini patterns; do not import that repo.

## File map

| Path | Responsibility |
| --- | --- |
| `src/lib/schema.ts` | Drizzle tables |
| `src/lib/db.ts` | Neon + Drizzle |
| `src/lib/auth.ts` | JWT session |
| `src/lib/password.ts` | bcrypt + validate |
| `src/lib/email.ts` | Resend reset mail |
| `src/lib/passwordReset.ts` | Reset tokens |
| `src/lib/users.ts` | createUser / getProfile |
| `src/lib/meals.ts` | meal CRUD, favorites, ratings |
| `src/lib/planSlots.ts` | slots, lock, swap, accept helpers |
| `src/lib/dates.ts` | week bounds (Mon–Sun) |
| `src/lib/mealSchema.ts` | Zod meal draft schema |
| `src/lib/ai/prompt.ts` | prompt builder |
| `src/lib/ai/gemini.ts` | generate drafts |
| `src/lib/geminiModel.ts` | model fallback |
| `src/middleware.ts` | auth gate → `/today` |
| `src/app/(app)/*` | Today, Week, Meals, Settings |
| `src/app/api/**` | auth, meals, plan, ai |

---

### Task 1: Scaffold + Vitest + theme tokens

**Files:** Create Next app root files, `vitest.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`

- [ ] Scaffold Next.js 16 + Tailwind 4 + deps (drizzle, neon, jose, bcryptjs, resend, zod, generative-ai, vitest)
- [ ] Add scripts: `dev`, `build`, `lint`, `test`, `db:push`, `db:studio`
- [ ] Theme CSS variables (paper, clay `#c45c26`, olive `#5c6b3c`, ink)
- [ ] Fraunces + Outfit in root layout
- [ ] Commit

### Task 2: Password + date helpers (TDD)

**Files:** `src/lib/password.ts`, `src/lib/dates.ts`, `src/lib/mealSchema.ts`, `src/lib/planSlotsLogic.ts`, tests under `src/lib/__tests__/`

- [ ] Tests: validatePassword, weekMonday, filterUnlockedTargets, mealDraftSchema parse/reject
- [ ] Implement until green
- [ ] Commit

### Task 3: Schema + DB

**Files:** `src/lib/schema.ts`, `src/lib/db.ts`, `drizzle.config.ts`

- [ ] profiles, password_reset_tokens, meals, meal_ratings, plan_slots
- [ ] Commit

### Task 4: Auth stack

**Files:** auth/passwordReset/email/users libs + `/api/auth/*` + auth pages + middleware

- [ ] Cookie `family_meal_session`; redirect authenticated users to `/today`
- [ ] Signup/login/logout/forgot/reset
- [ ] Commit

### Task 5: Meals + settings APIs/UI

**Files:** `src/lib/meals.ts`, `/api/meals/*`, `/api/settings`, Meals + Settings pages

- [ ] CRUD, favorite, rate; prefs (likes/dislikes/allergies/servings/maxCook/kitchenNotes)
- [ ] Commit

### Task 6: Plan slots Today + Week

**Files:** `src/lib/planSlots.ts`, `/api/plan/*`, Today + Week pages

- [ ] Get/upsert/clear/swap/lock; prev/next week
- [ ] Commit

### Task 7: Gemini draft → accept

**Files:** `src/lib/ai/*`, `/api/ai/suggest`, `/api/ai/accept`, draft UI modal

- [ ] Mockable generate; accept skips locked; optional context
- [ ] Commit

### Task 8: Landing + README + env

**Files:** landing page, `.env.example`, `README.md`, `AGENTS.md`

- [ ] Warm sibling landing; setup docs for Neon/Gemini/Resend/Vercel
- [ ] Commit

### Task 9: Verify

- [ ] `npm test` pass
- [ ] `npm run build` pass (or document env-only failures)
