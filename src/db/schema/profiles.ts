import {
  boolean,
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "approved",
  "rejected",
]);

type KycDocument = { type: string; url: string };

export const organizerProfiles = pgTable("organizer_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  state: varchar("state", { length: 50 }),
  city: varchar("city", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const vendorProfiles = pgTable(
  "vendor_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    businessName: varchar("business_name", { length: 150 }).notNull(),
    description: varchar("description", { length: 2000 }),
    state: varchar("state", { length: 50 }),
    city: varchar("city", { length: 50 }),
    kycDocuments: jsonb("kyc_documents")
      .$type<KycDocument[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    bankCode: varchar("bank_code", { length: 10 }),
    accountNumber: varchar("account_number", { length: 20 }),
    accountName: varchar("account_name", { length: 255 }), // server-resolved via Paystack
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("pending"),
    rejectionReason: varchar("rejection_reason", { length: 1000 }),
    payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("vendor_profiles_status_idx").on(t.verificationStatus),
    check(
      "vendor_profiles_payouts_check",
      sql`${t.payoutsEnabled} = false OR ${t.verificationStatus} = 'approved'`,
    ),
  ],
);

export const venueProfiles = pgTable(
  "venue_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 150 }).notNull(),
    description: varchar("description", { length: 2000 }),
    state: varchar("state", { length: 50 }),
    city: varchar("city", { length: 50 }),
    kycDocuments: jsonb("kyc_documents")
      .$type<KycDocument[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    bankCode: varchar("bank_code", { length: 10 }),
    accountNumber: varchar("account_number", { length: 20 }),
    accountName: varchar("account_name", { length: 255 }),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("pending"),
    rejectionReason: varchar("rejection_reason", { length: 1000 }),
    payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("venue_provider_profiles_status_idx").on(t.verificationStatus),
    check(
      "venue_provider_profiles_payouts_check",
      sql`${t.payoutsEnabled} = false OR ${t.verificationStatus} = 'approved'`,
    ),
  ],
);
