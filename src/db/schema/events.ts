import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizerId: uuid("organizer_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 100 }),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  location: varchar("location", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  budget: integer("budget"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
