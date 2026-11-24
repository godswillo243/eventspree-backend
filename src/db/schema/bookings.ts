import {
  bigint,
  check,
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { events } from "./events";
import { inquiries } from "./inquiries";
import { vendorListings } from "./vendor-listings";
import { venues } from "./venues";

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
    organizerId: uuid("organizer_id")
      .notNull()
      .references(() => users.id),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => users.id),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    inquiryId: uuid("inquiry_id").references(() => inquiries.id),
    vendorListingId: uuid("vendor_listing_id").references(
      () => vendorListings.id,
    ),
    venueId: uuid("venue_id").references(() => venues.id),
    status: bookingStatusEnum("status").notNull().default("pending_payment"),

    agreedPrice: bigint("agreed_price", { mode: "number" }).notNull(),
    // effective rate, display only. commission_amount is the source of truth.
    // NO default: the service must always snapshot it.
    commissionRate: numeric("commission_rate", {
      precision: 5,
      scale: 4,
    }).notNull(),
    commissionAmount: bigint("commission_amount", { mode: "number" }).notNull(),
    payoutAmount: bigint("payout_amount", { mode: "number" }).notNull(),

    providerCompletedAt: timestamp("provider_completed_at", {
      withTimezone: true,
    }),
    organizerCompletedAt: timestamp("organizer_completed_at", {
      withTimezone: true,
    }),

    paidOutAt: timestamp("paid_out_at", { withTimezone: true }),
    payoutReference: varchar("payout_reference", { length: 255 }),

    disputeReason: varchar("dispute_reason", { length: 2000 }),
    disputedAt: timestamp("disputed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("bookings_organizer_idx").on(t.organizerId),
    index("bookings_provider_idx").on(t.providerId),
    index("bookings_event_idx").on(t.eventId),
    index("bookings_vendor_listing_idx").on(t.vendorListingId),
    index("bookings_venue_idx").on(t.venueId),
    index("bookings_status_idx").on(t.status),
    index("bookings_payouts_due_idx")
      .on(t.updatedAt)
      .where(sql`${t.status} = 'completed' AND ${t.paidOutAt} IS NULL`),
    check(
      "bookings_one_target_check",
      sql`(${t.vendorListingId} IS NOT NULL AND ${t.venueId} IS NULL) OR (${t.vendorListingId} IS NULL AND ${t.venueId} IS NOT NULL)`,
    ),
    check(
      "bookings_amounts_check",
      sql`${t.agreedPrice} > 0 AND ${t.commissionAmount} >= 0 AND ${t.payoutAmount} >= 0`,
    ),
    check(
      "bookings_split_check",
      sql`${t.commissionAmount} + ${t.payoutAmount} = ${t.agreedPrice}`,
    ),
    check(
      "bookings_rate_check",
      sql`${t.commissionRate} >= 0 AND ${t.commissionRate} <= 1`,
    ),
    check(
      "bookings_paid_out_check",
      sql`${t.paidOutAt} IS NULL OR ${t.payoutReference} IS NOT NULL`,
    ),
  ],
);
