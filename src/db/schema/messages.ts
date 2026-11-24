import {
  bigint,
  check,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { inquiries } from "./inquiries";

export const offerStatusEnum = pgEnum("offer_status", [
  "pending",
  "accepted",
  "rejected",
  "withdrawn",
  "superseded",
]);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inquiryId: uuid("inquiry_id")
      .notNull()
      .references((): AnyPgColumn => inquiries.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    body: varchar("body", { length: 2000 }).notNull(),
    offerAmount: bigint("offer_amount", { mode: "number" }),
    offerStatus: offerStatusEnum("offer_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("messages_inquiry_created_idx").on(t.inquiryId, t.createdAt),
    check(
      "messages_offer_consistency",
      sql`(${t.offerAmount} IS NULL AND ${t.offerStatus} IS NULL) OR (${t.offerAmount} IS NOT NULL AND ${t.offerStatus} IS NOT NULL AND ${t.offerAmount} > 0)`,
    ),
    // supersede the old pending offer (UPDATE) BEFORE inserting a new one
    uniqueIndex("messages_one_pending_offer_per_inquiry")
      .on(t.inquiryId)
      .where(sql`${t.offerStatus} = 'pending'`),
  ],
);
