import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
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
    type: otpTypeEnum("type").notNull(),
    codeHash: varchar("code_hash", { length: 255 }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("otp_records_user_type_idx").on(t.userId, t.type),
    check("otp_records_attempts_check", sql`${t.attempts} >= 0`),
  ],
);
