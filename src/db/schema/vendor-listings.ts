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
import { vendorProfiles, verificationStatusEnum } from "./profiles";
import { categories } from "./categories";
import { priceUnitEnum } from "./enums";

export const vendorListings = pgTable(
  "vendor_listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vendorProfileId: uuid("vendor_profile_id")
      .notNull()
      .references(() => vendorProfiles.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 2000 }),
    priceMin: bigint("price_min", { mode: "number" }).notNull(),
    priceMax: bigint("price_max", { mode: "number" }).notNull(),
    priceUnit: priceUnitEnum("price_unit").notNull().default("fixed"),
    state: varchar("state", { length: 50 }),
    city: varchar("city", { length: 50 }),
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
    rejectionReason: varchar("rejection_reason", { length: 1600 }),
    isActive: boolean("is_active").notNull().default(true),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }), // string in JS; null = no reviews
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
    index("vendor_listings_profile_idx").on(t.vendorProfileId),
    index("vendor_listings_category_idx").on(t.categoryId),
    index("vendor_listings_visibility_idx").on(
      t.verificationStatus,
      t.isActive,
    ),
    index("vendor_listings_location_idx").on(t.state, t.city),
    check(
      "vendor_listings_price_check",
      sql`${t.priceMin} >= 0 AND ${t.priceMax} >= ${t.priceMin}`,
    ),
  ],
);
