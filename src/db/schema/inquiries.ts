import { check, index, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { venues } from "./venues";
import { vendorListings } from "./vendor-listings";
import { users } from "./users";
import { events } from "./events";
import { targetTypeEnum } from "./enums";
import { messages } from "./messages";

export const inquiryStatusEnum = pgEnum("inquiry_status", ["open", "closed"]);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    organizerId: uuid("organizer_id").notNull().references(() => users.id),

    targetType: targetTypeEnum("target_type").notNull(),
    vendorListingId: uuid("vendor_listing_id").references(() => vendorListings.id),
    venueId: uuid("venue_id").references(() => venues.id),

    status: inquiryStatusEnum("status").notNull().default("open"),
    declinedAt: timestamp("declined_at", { withTimezone: true }),
    // Not a DB FK — avoids circular module reference, enforced at app layer. Relation declared in relations.ts.
    acceptedOfferMessageId: uuid("accepted_offer_message_id").references(() => messages.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("inquiries_vendor_listing_idx").on(t.vendorListingId),
    index("inquiries_venue_idx").on(t.venueId),
    index("inquiries_organizer_idx").on(t.organizerId),
    check(
      "inquiries_exactly_one_target",
      sql`(vendor_listing_id IS NOT NULL AND venue_id IS NULL) OR (vendor_listing_id IS NULL AND venue_id IS NOT NULL)`
    ),
    check(
      "inquiries_target_matches_type",
      sql`(target_type = vendor AND vendor_listing_id IS NOT NULL AND venue_id IS NULL)
        OR (target_type = venue AND venue_id IS NOT NULL AND vendor_listing_id IS NULL)`
    ),
  ]
);
