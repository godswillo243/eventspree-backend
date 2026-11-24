import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const adminLogTargetTypeEnum = pgEnum("admin_log_target_type", [
  "vendor_profile",
  "venue_provider_profile",
  "venue",
  "vendor_listing",
  "user",
  "booking",
]);

export const adminLogs = pgTable(
  "admin_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => users.id),
    action: varchar("action", { length: 200 }).notNull(),
    targetType: adminLogTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    notes: varchar("notes", { length: 2000 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("admin_logs_target_idx").on(t.targetType, t.targetId),
    index("admin_logs_admin_idx").on(t.adminId),
  ],
);
