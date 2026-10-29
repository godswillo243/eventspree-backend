import { check, index, integer, jsonb, numeric, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { venueProviderProfiles, verificationStatusEnum } from "./profiles";
import { categories } from "./categories";

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    venueProviderId: uuid("venue_provider_id")
      .notNull()
      .references(() => venueProviderProfiles.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 2000 }),
    // Must have categories.appliesTo = venue — enforced at app layer.
    venueTypeId: uuid("venue_type_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),

    address: varchar("address", { length: 500 }).notNull(),
    state: varchar("state", { length: 100 }),
    city: varchar("city", { length: 100 }),

    capacityMin: integer("capacity_min"),
    capacityMax: integer("capacity_max"),
    amenities: jsonb("amenities").$type<string[]>().notNull().default([]),

    priceMin: integer("price_min"),
    priceMax: integer("price_max"),

    portfolioImages: jsonb("portfolio_images").$type<string[]>().notNull().default([]),
    blockedDates: jsonb("blocked_dates").$type<string[]>().notNull().default([]),

    verificationStatus: verificationStatusEnum("verification_status").notNull().default("pending"),
    rejectionReason: varchar("rejection_reason", { length: 1000 }),

    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }).notNull().default("0"),
    ratingCount: integer("rating_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("venues_provider_idx").on(t.venueProviderId),
    index("venues_status_idx").on(t.verificationStatus),
    index("venues_venue_type_idx").on(t.venueTypeId),
    check(
      "venues_capacity_range_check",
      sql`(capacity_min IS NULL OR capacity_min >= 0)
        AND (capacity_max IS NULL OR capacity_max >= 0)
        AND (capacity_min IS NULL OR capacity_max IS NULL OR capacity_min <= capacity_max)`
    ),
    check(
      "venues_price_range_check",
      sql`(price_min IS NULL OR price_min >= 0)
        AND (price_max IS NULL OR price_max >= 0)
        AND (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)`
    ),
    check("venues_rating_avg_check", sql`rating_avg >= 0 AND rating_avg <= 5`),
    check("venues_rating_count_check", sql`rating_count >= 0`),
  ]
);
