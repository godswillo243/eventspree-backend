import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizerId: uuid("organizer_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 2000 }),
    eventType: varchar("event_type", { length: 100 }),
    eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
    location: jsonb("location")
      .$type<{ city: string; state: string; address?: string }>()
      .notNull(),
    guestCount: integer("guest_count").notNull(),
    budget: bigint("budget", { mode: "number" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("events_organizer_date_idx").on(t.organizerId, t.eventDate),
    check("events_budget_check", sql`${t.budget} IS NULL OR ${t.budget} >= 0`),
    check("events_guest_count_check", sql`${t.guestCount} > 0`),
  ],
);
