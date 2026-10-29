import { check, index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { bookings } from "./bookings";
import { users } from "./users";
import { vendorListings } from "./vendor-listings";
import { venues } from "./venues";
import { targetTypeEnum } from "./enums";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id").notNull().references(() => users.id),

    targetType: targetTypeEnum("target_type").notNull(),
    vendorListingId: uuid("vendor_listing_id").references(() => vendorListings.id),
    venueId: uuid("venue_id").references(() => venues.id),

    rating: integer("rating").notNull(),
    comment: varchar("comment", { length: 2000 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("reviews_booking_reviewer_unique").on(t.bookingId, t.reviewerId),
    index("reviews_vendor_listing_idx").on(t.vendorListingId),
    index("reviews_venue_idx").on(t.venueId),
    check("reviews_rating_range", sql`rating BETWEEN 1 AND 5`),
    check(
      "reviews_exactly_one_target",
      sql`(vendor_listing_id IS NOT NULL AND venue_id IS NULL) OR (vendor_listing_id IS NULL AND venue_id IS NOT NULL)`
    ),
    check(
      "reviews_target_matches_type",
      sql`(target_type = vendor AND vendor_listing_id IS NOT NULL AND venue_id IS NULL)
        OR (target_type = venue AND venue_id IS NOT NULL AND vendor_listing_id IS NULL)`
    ),
  ]
); 
