import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  shareCode: text("share_code").notNull().unique(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  // 'date' | 'activity' | 'both'
  mode: text("mode").notNull().default("both"),
  // JSON-encoded string array of ISO dates chosen by organizer
  dates: text("dates").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const participantsTable = pgTable("participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => eventsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const availabilitySlotsTable = pgTable("availability_slots", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id")
    .notNull()
    .references(() => participantsTable.id, { onDelete: "cascade" }),
  eventId: integer("event_id")
    .notNull()
    .references(() => eventsTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  timeBlock: text("time_block").notNull(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({
  id: true,
  createdAt: true,
});
export const insertParticipantSchema = createInsertSchema(participantsTable).omit({
  id: true,
  createdAt: true,
});
export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlotsTable).omit({
  id: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participantsTable.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type AvailabilitySlot = typeof availabilitySlotsTable.$inferSelect;
