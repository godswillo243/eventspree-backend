import { boolean, check, index, integer, jsonb, numeric, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { vendorProfiles, verificationStatusEnum } from "./profiles";
import { categories } from "./categories";

export const priceUnitEnum = pgEnum("price_unit", ["fixed", "per_day", "per_hour", "per_guest"]);

export const vendorListings = pgTable(
  "vendor_listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    vendorProfileId: uuid("vendor_profile_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    // Must have categories.appliesTo = vendor — enforced at app layer, not DB.
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),

    title: varchar("title", { length: 255 }).notNull(),
    description: varchar("description", { length: 2000 }),
    priceMin: integer("price_min"),
    priceMax: integer("price_max"),
    priceUnit: priceUnitEnum("price_unit").notNull().default("fixed"),

    portfolioImages: jsonb("portfolio_images").$type<string[]>().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),

    verificationStatus: verificationStatusEnum("verification_status").notNull().default("pending"),
    rejectionReason: varchar("rejection_reason", { length: 1000 }),

    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }).notNull().default("0"),
    ratingCount: integer("rating_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vendor_listings_vendor_idx").on(t.vendorProfileId),
    index("vendor_listings_category_idx").on(t.categoryId),
    index("vendor_listings_status_idx").on(t.verificationStatus),
    index("vendor_listings_active_idx").on(t.isActive),
    check(
      "vendor_listings_price_range_check",
      sql`(price_min IS NULL OR price_min >= 0)
        AND (price_max IS NULL OR price_max >= 0)
        AND (price_min IS NULL OR price_max IS NULL OR price_min <= price_max)`
    ),
    check("vendor_listings_rating_avg_check", sql`rating_avg >= 0 AND rating_avg <= 5`),
    check("vendor_listings_rating_count_check", sql`rating_count >= 0`),
  ]
);
