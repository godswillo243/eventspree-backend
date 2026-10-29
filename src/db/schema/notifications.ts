import {
  boolean,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "new_inquiry",
  "new_message",
  "new_offer",
  "offer_accepted",
  "offer_declined",
  "booking_confirmed",
  "payment_received",
  "completion_requested", // other party marked their side complete
  "booking_completed",
  "review_received",
  "listing_approved",
  "listing_rejected",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: varchar("body", { length: 1000 }),
    linkEntityType: varchar("link_entity_type", { length: 50 }), // 'inquiry' | 'booking' | 'vendor_listing' | 'venue'
    linkEntityId: uuid("link_entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("notifications_user_unread_idx").on(t.userId, t.isRead),
    index("notifications_user_created_idx").on(t.userId, t.createdAt),
  ]
);
