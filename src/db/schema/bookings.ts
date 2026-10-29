import { check, index, integer, numeric, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { events } from "./events";
import { inquiries } from "./inquiries";
import { vendorListings } from "./vendor-listings";
import { venues } from "./venues";
import { users } from "./users";
import { targetTypeEnum } from "./enums";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending_payment",
  "confirmed",
  "completed",
  "disputed",
  "refunded",
  "cancelled",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inquiryId: uuid("inquiry_id").notNull().unique().references(() => inquiries.id),
    eventId: uuid("event_id").notNull().references(() => events.id),
    organizerId: uuid("organizer_id").notNull().references(() => users.id),

    targetType: targetTypeEnum("target_type").notNull(),
    vendorListingId: uuid("vendor_listing_id").references(() => vendorListings.id),
    venueId: uuid("venue_id").references(() => venues.id),

    // Denormalized — resolved at booking-creation time from either
    // vendorListings.vendorProfileId → vendorProfiles.userId,
    // or venues.venueProviderId → venueProviderProfiles.userId.
    providerId: uuid("provider_id").notNull().references(() => users.id),

    agreedPrice: integer("agreed_price").notNull(),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 4 }).notNull().default("0.05"),
    commissionAmount: integer("commission_amount").notNull(),
    payoutAmount: integer("payout_amount").notNull(),

    status: bookingStatusEnum("status").notNull().default("pending_payment"),
    vendorMarkedCompleteAt: timestamp("vendor_marked_complete_at", { withTimezone: true }),
    organizerConfirmedCompleteAt: timestamp("organizer_confirmed_complete_at", { withTimezone: true }),

    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("bookings_vendor_listing_idx").on(t.vendorListingId),
    index("bookings_venue_idx").on(t.venueId),
    index("bookings_organizer_idx").on(t.organizerId),
    index("bookings_provider_idx").on(t.providerId),
    index("bookings_status_idx").on(t.status),
    check(
      "bookings_exactly_one_target",
      sql`(vendor_listing_id IS NOT NULL AND venue_id IS NULL) OR (vendor_listing_id IS NULL AND venue_id IS NOT NULL)`
    ),
    check(
      "bookings_target_matches_type",
      sql`(target_type = vendor AND vendor_listing_id IS NOT NULL AND venue_id IS NULL)
        OR (target_type = venue AND venue_id IS NOT NULL AND vendor_listing_id IS NULL)`
    ),
  ]
);
