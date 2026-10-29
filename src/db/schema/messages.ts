import { index, integer, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { inquiries } from "./inquiries";
import { users } from "./users";

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
    senderId: uuid("sender_id").notNull().references(() => users.id),
    body: varchar("body", { length: 2000 }).notNull(),
    proposedPrice: integer("proposed_price"),
    offerStatus: offerStatusEnum("offer_status"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_inquiry_idx").on(t.inquiryId)]
);
