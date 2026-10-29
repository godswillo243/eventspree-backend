import { check, integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { vendorListings } from "./vendor-listings";
import { venues } from "./venues";
import { sql } from "drizzle-orm";
import { payments } from "./payments";
import { targetTypeEnum } from "./enums";

export const featuredListingPurchases = pgTable(
  "featured_listing_purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    targetType: targetTypeEnum("target_type").notNull(),
    vendorListingId: uuid("vendor_listing_id").references(
      () => vendorListings.id
    ),
    venueId: uuid("venue_id").references(() => venues.id),

    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    durationDays: integer("duration_days").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  () => [
    check(
      "featured_exactly_one_target",
      sql`(vendor_listing_id IS NOT NULL AND venue_id IS NULL) OR (vendor_listing_id IS NULL AND venue_id IS NOT NULL)`
    ),
    check(
      "featured_target_matches_type",
      sql`(target_type = 'vendor' AND vendor_listing_id IS NOT NULL AND venue_id IS NULL)
   OR (target_type = 'venue' AND venue_id IS NOT NULL AND vendor_listing_id IS NULL)`
    ),
  ]
);
