# Family Meal Planner — Design Spec

**Date:** 2026-08-10  
**Status:** Approved / implemented  
**Workspace:** `family-meal-planner` (sibling of `bucket-list`, not nested)

## 1. Problem

A household (father, mother, 3-year-old) wings meals day-to-day. Cooking experience is limited, so deciding what to cook is stressful. They need AI-assisted planning for breakfast, lunch, and dinner across a day or week, grounded in likes/dislikes, allergies (for any household), favorites, and past ratings—always toddler-friendly by default.

## 2. Goals (MVP)

- Shared **one household account** (single login, shared plan and preferences).
- Plan **breakfast + lunch + dinner**.
- **Meal library** of saved recipes (AI-accepted and manual).
- **Calendar planner**: Today + Week (Mon–Sun) slots.
- AI: suggest one meal, plan day, plan week, replace meal/day/week.
- Optional free-text context on each AI prompt (“This week I’m feeling like…”).
- Draft → **Accept / Reject** (nothing written to plan until Accept).
- **Slot locking**: bulk regenerate skips locked slots; single-slot replace/edit still allowed.
- Favorites + post-cook thumbs up/down + optional note; AI uses all of that + history.
- Settings: likes, dislikes, allergies, default servings, optional max cook time, kitchen notes.
- Auth identical in spirit to bucket-list: email/password in Neon, bcrypt, jose session, Resend reset.
- AI: **Gemini**. Deploy: **Vercel**. Stack: Next.js, TypeScript, Tailwind, Neon, Drizzle.

## 3. Non-goals (MVP)

- Grocery / shopping list (future).
- Multi-user invites / separate spouse logins.
- Adult-only meal mode.
- Recipe images / external recipe APIs.
- Nutrition macros, leftovers modeling, snacks, print sheet, PWA, push notifications.

## 4. Personas & constraints

- Primary users: two parents sharing one account on phones (mobile-first).
- Child: every suggested meal must be **toddler-friendly by default**.
- Default servings: **3** (configurable).
- Week starts **Monday**.
- Ingredient units: **US**.
- No household allergies today; allergy fields still required in settings for other households.

## 5. Architecture (Approach A)

Structured **calendar + meal library**. Chat is not the primary UI.

```
[Browser]
  Today | Week | Meals | Settings | Auth
        ↓
[Next.js Route Handlers]
  /api/auth/*  /api/meals/*  /api/plan/*  /api/ai/*
        ↓
[Neon Postgres via Drizzle]
  profiles, password_reset_tokens, meals, meal_ratings, plan_slots
        ↓
[Gemini]  (mocked in tests)
```

Auth/session/Gemini helpers are **reimplemented** from bucket-list patterns, not imported as a shared package.

## 6. Data model

### `profiles` (household)

- `id`, `email` (unique), `passwordHash`, `name`
- `defaultServings` (default 3)
- `likes`, `dislikes`, `allergies` — text arrays (or JSON arrays)
- `maxCookTimeMinutes` (nullable)
- `kitchenNotes` (nullable text)
- timestamps

### `password_reset_tokens`

Same shape as bucket-list: `userId`, `tokenHash`, `expiresAt`, `usedAt`.

### `meals` (library)

- `id`, `userId`
- `title`, `mealType` (`breakfast` | `lunch` | `dinner`)
- `description` (optional short blurb)
- `ingredients` (JSON array of `{ name, quantity, unit? }`)
- `steps` (JSON array of strings)
- `skillLevel` (`beginner` | `intermediate` | `hard`)
- `cookTimeMinutes`, `servings`
- `favorited` (boolean)
- `source` (`ai` | `manual`)
- timestamps

### `meal_ratings`

- `id`, `userId`, `mealId`
- `rating` (`up` | `down`)
- `note` (nullable)
- `cookedAt`
- timestamps

### `plan_slots`

- `id`, `userId`
- `date` (date only, timezone: household local / browser-local date strings `YYYY-MM-DD`)
- `mealType` (`breakfast` | `lunch` | `dinner`)
- `mealId` (nullable FK → meals)
- `locked` (boolean, default false)
- unique `(userId, date, mealType)`

No separate `meal_plans` container table (YAGNI).

## 7. UX

### Visual theme (sibling to bucket-list)

- Warm paper background, soft cream surfaces, deep ink, muted secondary text.
- **Sibling accents:** clay/terracotta primary + soft olive secondary (less travel-teal than bucket-list).
- Fonts: **Fraunces** (display) + **Outfit** (body).
- Subtle atmospheric washes only — no purple/neon/tech gradients, no dark-mode-first, no Inter/Roboto defaults.
- Landing: brand-forward, full-bleed real food/kitchen imagery if shipped; hero stays simple (brand, one headline, short support, CTA).
- Motion: 2–3 quiet animations (enter, draft appear, accept).

### Screens

1. **Landing** (logged out) — brand + CTA to signup/login.
2. **Auth** — signup, login, forgot, reset password.
3. **Today** — three slots; suggest (optional context); open recipe; mark cooked + thumbs; lock toggle.
4. **Week** — 7×3 grid; prev/next week; plan week / plan day / replace; swap from library; lock; clear/edit.
5. **Meals** — searchable library; filters (type, favorite, skill); manual create/edit; favorites via filter (no separate top-level nav required).
6. **Settings** — likes/dislikes/allergies tags, servings, max cook time, kitchen notes, account.

### AI draft flow

1. User chooses action + optional context string.
2. Server builds prompt (toddler-friendly, prefs, allergies, recent slots, favorites, ratings, context, target slots excluding locked for bulk).
3. Gemini returns structured JSON; Zod validates.
4. UI shows **draft preview**.
5. **Accept** → create/update `meals` rows as needed, write `plan_slots` for applicable unlocked targets.
6. **Reject** → discard; DB plan unchanged.

## 8. AI behavior

**Scopes:** `one_meal` | `day` | `week` | `replace_slot` | `replace_day` | `replace_week`.

**Each meal JSON:** title, mealType, ingredients[], steps[], skillLevel, cookTimeMinutes, servings, short why-it-fits note.

**Prompt always includes:** toddler-friendly requirement; likes/dislikes/allergies; default servings; max cook time / kitchen notes if set; recent planned meals (avoid same-week repeats); prefer favorites and thumbs-up; avoid thumbs-down; optional user context string.

**Bulk regenerate:** only unlocked slots are targets; locked meals stay.

## 9. Error handling

| Situation | Behavior |
| --- | --- |
| Invalid login / signup | Inline errors; login uses generic “invalid email or password” |
| Gemini timeout / API failure | Friendly message; plan unchanged; retry |
| Invalid/partial JSON | No draft apply; “Couldn’t parse suggestion — try again”; server log |
| Accept with locks/races | Re-check locks; skip locked; warn if some slots skipped |
| Delete meal in use | Block hard-delete or require unlink; don’t orphan history silently |
| Empty prefs on first AI | Soft nudge to Settings; AI still allowed with defaults |
| Unauthorized | 401 → login |
| Double Accept | Disable while saving or idempotent draft id |

## 10. Testing

- **Unit:** password, session, preference serialize, slot uniqueness, lock-skip, Zod meal schema.
- **API:** auth, meal CRUD, assign/swap/lock, ratings, accept applies only unlocked.
- **AI:** mock Gemini; assert prompt context; reject bad JSON; locked slots omitted from bulk targets.
- **No live Gemini in CI.**
- **Smoke:** signup → prefs → plan week draft → accept → lock one → replan week → locked unchanged.

## 11. Implementation sequence (after this spec is approved)

1. Superpowers `writing-plans` → bite-sized TDD plan under `docs/superpowers/plans/`.
2. Execute via `subagent-driven-development` or `executing-plans`.
3. Scaffold → auth → schema → meals/settings → calendar/locks → Gemini drafts → Vercel.

## 12. Env (deploy)

- `DATABASE_URL` (Neon)
- `AUTH_SECRET`
- `GEMINI_API_KEY`
- `RESEND_API_KEY` (+ from-address as needed)
- App URL for reset links

## 13. Open follow-ups (non-blocking)

- Exact clay/olive hex tokens during UI implementation.
- Soft-archive vs unlink-on-delete meal UX copy.
- Whether landing ships in first deploy or auth-only entry.
