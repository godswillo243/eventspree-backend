import {
  bigint,
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { bookings } from "./bookings";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "success",
  "failed",
]);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id),
    reference: varchar("reference", { length: 100 }).notNull().unique(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    platformFee: bigint("platform_fee", { mode: "number" }).notNull(), // = booking.commissionAmount
    status: paymentStatusEnum("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    rawWebhookPayload: jsonb("raw_webhook_payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("payments_booking_idx").on(t.bookingId),
    uniqueIndex("payments_one_success_per_booking_uq")
      .on(t.bookingId)
      .where(sql`${t.status} = 'success'`),
    check(
      "payments_amount_check",
      sql`${t.amount} > 0 AND ${t.platformFee} >= 0`,
    ),
  ],
);
