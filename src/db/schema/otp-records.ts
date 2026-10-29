import { check, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const otpTypeEnum = pgEnum("otp_type", [
  "email_verification",
  "password_reset",
  "two_factor",
  "account_deletion",
]);

export const otpRecords = pgTable(
  "otp_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    type: otpTypeEnum("type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
  },
  (t) => [
    index("otp_records_user_type_idx").on(t.userId, t.type),
    check("otp_records_attempts_check", sql`attempts >= 0 AND max_attempts > 0`),
  ]
);
