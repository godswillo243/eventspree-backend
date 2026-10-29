import { index, integer, jsonb, pgEnum, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { bookings } from "./bookings";
import { users } from "./users";

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "success", "failed"]);

// MVP: every payment is a booking payment (featured-listing payments deferred —
// re-add a `purpose` discriminator + nullable bookingId when that module ships).
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
    payerId: uuid("payer_id").notNull().references(() => users.id),

    reference: varchar("reference", { length: 100 }).notNull(),
    subaccountCode: varchar("subaccount_code", { length: 100 }),

    amount: integer("amount").notNull(),
    platformFee: integer("platform_fee"),
    payoutAmount: integer("payout_amount"),
    currency: varchar("currency", { length: 10 }).notNull().default("NGN"),

    status: paymentStatusEnum("status").notNull().default("pending"),
    rawWebhookPayload: jsonb("raw_webhook_payload"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("payments_reference_idx").on(t.reference),
    index("payments_booking_idx").on(t.bookingId),
  ]
);
