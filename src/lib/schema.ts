import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const mealTypes = ["breakfast", "lunch", "dinner"] as const;
export type MealType = (typeof mealTypes)[number];

export const skillLevels = ["beginner", "intermediate", "hard"] as const;
export type SkillLevel = (typeof skillLevels)[number];

export type Ingredient = {
  name: string;
  quantity: string;
  unit?: string;
};

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  defaultServings: integer("default_servings").notNull().default(3),
  likes: jsonb("likes").$type<string[]>().notNull().default([]),
  dislikes: jsonb("dislikes").$type<string[]>().notNull().default([]),
  allergies: jsonb("allergies").$type<string[]>().notNull().default([]),
  maxCookTimeMinutes: integer("max_cook_time_minutes"),
  kitchenNotes: text("kitchen_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const meals = pgTable("meals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  mealType: text("meal_type").notNull(),
  description: text("description").notNull().default(""),
  ingredients: jsonb("ingredients").$type<Ingredient[]>().notNull().default([]),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  skillLevel: text("skill_level").notNull().default("beginner"),
  cookTimeMinutes: integer("cook_time_minutes").notNull().default(30),
  servings: integer("servings").notNull().default(3),
  favorited: boolean("favorited").notNull().default(false),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const mealRatings = pgTable("meal_ratings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  mealId: uuid("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  rating: text("rating").notNull(),
  note: text("note"),
  cookedAt: timestamp("cooked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const planSlots = pgTable(
  "plan_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    mealType: text("meal_type").notNull(),
    mealId: uuid("meal_id").references(() => meals.id, {
      onDelete: "set null",
    }),
    locked: boolean("locked").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.userId, t.date, t.mealType)],
);
