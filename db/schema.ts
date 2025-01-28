import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  subscription: text("subscription").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  provider: text("provider"), // 'google', 'github', 'apple', or null for local auth
  providerUserId: text("provider_user_id"), // ID from the OAuth provider
  email: text("email"), // Added for social profile info
  avatar: text("avatar"), // URL to user's avatar
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const summaries = pgTable("summaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  videoId: text("video_id").notNull(),
  videoTitle: text("video_title").notNull(),
  videoDuration: integer("video_duration").notNull(),
  summary: text("summary").notNull(),
  format: text("format").notNull(),
  language: text("language").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
  summaries: many(summaries)
}));

export const summariesRelations = relations(summaries, ({ one }) => ({
  user: one(users, {
    fields: [summaries.userId],
    references: [users.id]
  })
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertSummarySchema = createInsertSchema(summaries);
export const selectSummarySchema = createSelectSchema(summaries);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;