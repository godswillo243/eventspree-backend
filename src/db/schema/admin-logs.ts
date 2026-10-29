import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const adminLogTargetTypeEnum = pgEnum("admin_log_target_type", [
  "vendor_profile",
  "venue_provider_profile",
  "venue",
  "vendor_listing",
  "user",
]);

export const adminLogs = pgTable("admin_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: adminLogTargetTypeEnum("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  notes: varchar("notes", { length: 1000 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
