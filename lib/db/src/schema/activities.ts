import { pgTable, serial, text, integer, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { participantsTable } from "./events";

export const activitiesTable = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  category: text("category").notNull(),
});

export const activityVotesTable = pgTable("activity_votes", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id")
    .notNull()
    .references(() => participantsTable.id, { onDelete: "cascade" }),
  activityId: integer("activity_id")
    .notNull()
    .references(() => activitiesTable.id, { onDelete: "cascade" }),
  liked: boolean("liked").notNull(),
}, (t) => [
  unique("activity_votes_participant_activity_unique").on(t.participantId, t.activityId),
]);

export const insertActivityVoteSchema = createInsertSchema(activityVotesTable).omit({
  id: true,
});

export type Activity = typeof activitiesTable.$inferSelect;
export type ActivityVote = typeof activityVotesTable.$inferSelect;
export type InsertActivityVote = z.infer<typeof insertActivityVoteSchema>;
