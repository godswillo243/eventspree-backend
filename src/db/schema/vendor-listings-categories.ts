import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const vendorListingsCategories = pgTable(
  "vendor_listing_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 })
      .notNull()
      .unique("vendor_listing_categories_slug"),
    description: varchar("description", { length: 500 }),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("vendor_listing_slug_idx").on(t.slug)]
);
