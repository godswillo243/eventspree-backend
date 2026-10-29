import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "suspended",
  "inactive",
]);
export const userRole = pgEnum("user_role", [
  "admin",
  "user",
  "moderator",
  "support",
]);
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  googleAuthId: varchar("google_auth_id", { length: 100 }),
  isStaff: boolean("is_staff").notNull().default(false),
  role: userRole("role").notNull().default("user"),
  status: userStatusEnum("status").notNull().default("active"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
