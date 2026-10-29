import { boolean, index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { targetTypeEnum } from "./enums";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appliesTo: targetTypeEnum("applies_to").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: varchar("description", { length: 500 }),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("categories_slug_applies_to_idx").on(t.slug, t.appliesTo),
    index("categories_applies_to_active_idx").on(t.appliesTo, t.isActive),
  ]
);
