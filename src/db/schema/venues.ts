import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { venueProfiles, verificationStatusEnum } from "./profiles";
import { categories } from "./categories";
import { priceUnitEnum } from "./enums";

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    venueProfileId: uuid("venue_profile_id")
      .notNull()
      .references(() => venueProfiles.id),
    venueTypeId: uuid("venue_type_id")
      .notNull()
      .references(() => categories.id),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 2000 }),
    address: varchar("address", { length: 300 }).notNull(),
    state: varchar("state", { length: 50 }),
    city: varchar("city", { length: 50 }),
    capacityMin: integer("capacity_min"),
    capacityMax: integer("capacity_max"),
    amenities: jsonb("amenities")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    priceMin: bigint("price_min", { mode: "number" }).notNull(),
    priceMax: bigint("price_max", { mode: "number" }).notNull(),
    priceUnit: priceUnitEnum("price_unit").notNull().default("per_day"),
    portfolioImages: jsonb("portfolio_images")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    blockedDates: jsonb("blocked_dates")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("pending"),
    rejectionReason: varchar("rejection_reason", { length: 1000 }),
    isActive: boolean("is_active").notNull().default(true),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }),
    ratingCount: integer("rating_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("venues_idx").on(t.venueProfileId),
    index("venues_type_idx").on(t.venueTypeId),
    index("venues_visibility_idx").on(t.verificationStatus, t.isActive),
    index("venues_location_idx").on(t.state, t.city),
    check(
      "venues_price_check",
      sql`${t.priceMin} >= 0 AND ${t.priceMax} >= ${t.priceMin}`,
    ),
    check(
      "venues_capacity_check",
      sql`(${t.capacityMin} IS NULL OR ${t.capacityMin} > 0)
        AND (${t.capacityMax} IS NULL OR ${t.capacityMax} > 0)
        AND (${t.capacityMin} IS NULL OR ${t.capacityMax} IS NULL OR ${t.capacityMax} >= ${t.capacityMin})`,
    ),
  ],
);
