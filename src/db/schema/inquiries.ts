import {
  check,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { events } from "./events";
import { vendorListings } from "./vendor-listings";
import { venues } from "./venues";
import { messages } from "./messages";

export const inquiryStatusEnum = pgEnum("inquiry_status", ["open", "closed"]);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizerId: uuid("organizer_id")
      .notNull()
      .references(() => users.id),
    providerId: uuid("provider_id") // denormalized: owner user of the target
      .notNull()
      .references(() => users.id),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    vendorListingId: uuid("vendor_listing_id").references(
      () => vendorListings.id,
    ),
    venueId: uuid("venue_id").references(() => venues.id),
    status: inquiryStatusEnum("status").notNull().default("open"),
    declinedAt: timestamp("declined_at", { withTimezone: true }),
    // real FK, lazy ref because inquiries <-> messages are circular. Don't "clean up".
    acceptedOfferMessageId: uuid("accepted_offer_message_id").references(
      (): AnyPgColumn => messages.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("inquiries_organizer_idx").on(t.organizerId),
    index("inquiries_provider_idx").on(t.providerId),
    index("inquiries_event_idx").on(t.eventId),
    index("inquiries_vendor_listing_idx").on(t.vendorListingId),
    index("inquiries_venue_idx").on(t.venueId),
    check(
      "inquiries_one_target_check",
      sql`(${t.vendorListingId} IS NOT NULL AND ${t.venueId} IS NULL) OR (${t.vendorListingId} IS NULL AND ${t.venueId} IS NOT NULL)`,
    ),
    uniqueIndex("inquiries_one_open_per_event_vendor_uq")
      .on(t.eventId, t.vendorListingId)
      .where(sql`${t.status} = 'open' AND ${t.vendorListingId} IS NOT NULL`),
    uniqueIndex("inquiries_one_open_per_event_venue_uq")
      .on(t.eventId, t.venueId)
      .where(sql`${t.status} = 'open' AND ${t.venueId} IS NOT NULL`),
  ],
);
