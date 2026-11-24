import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { bookings } from "./bookings";
import { users } from "./users";

export const reviewDirectionEnum = pgEnum("review_direction", [
  "organizer_to_provider",
  "provider_to_organizer",
]);
export const providerTypeEnum = pgEnum("provider_type", [
  "vendor",
  "venue_provider",
]);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id),
    revieweeId: uuid("reviewee_id")
      .notNull()
      .references(() => users.id),
    direction: reviewDirectionEnum("direction").notNull(), // server-derived
    providerType: providerTypeEnum("provider_type").notNull(),
    rating: integer("rating").notNull(),
    comment: varchar("comment", { length: 2000 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("reviews_booking_reviewer_uq").on(t.bookingId, t.reviewerId),
    index("reviews_reviewee_idx").on(t.revieweeId),
    check("reviews_rating_check", sql`${t.rating} BETWEEN 1 AND 5`),
    check("reviews_not_self_check", sql`${t.reviewerId} <> ${t.revieweeId}`),
  ],
);
