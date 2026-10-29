import { boolean, index, jsonb, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const verificationStatusEnum = pgEnum("verification_status", ["pending", "approved", "rejected"]);

export const organizerProfiles = pgTable("organizer_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Business/KYC/payout wrapper only. Bookable products live in vendor_listings.
export const vendorProfiles = pgTable(
  "vendor_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().unique().references(() => users.id),
    businessName: varchar("business_name", { length: 255 }).notNull(),
    description: varchar("description", { length: 2000 }),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
    state: varchar("state", { length: 100 }),
    city: varchar("city", { length: 100 }),
    kycDocuments: jsonb("kyc_documents").$type<string[]>().notNull().default([]),
    blockedDates: jsonb("blocked_dates").$type<string[]>().notNull().default([]),
    bankCode: varchar("bank_code", { length: 20 }),
    accountNumber: varchar("account_number", { length: 20 }),
    accountName: varchar("account_name", { length: 255 }),
    subaccountCode: varchar("subaccount_code", { length: 100 }),
    payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
    verificationStatus: verificationStatusEnum("verification_status").notNull().default("pending"),
    rejectionReason: varchar("rejection_reason", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("vendor_profiles_status_idx").on(t.verificationStatus)]
);

export const venueProviderProfiles = pgTable(
  "venue_provider_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().unique().references(() => users.id),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    contactName: varchar("contact_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
    kycDocuments: jsonb("kyc_documents").$type<string[]>().notNull().default([]),
    bankCode: varchar("bank_code", { length: 20 }),
    subaccountCode: varchar("subaccount_code", { length: 100 }),
    payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
    accountNumber: varchar("account_number", { length: 20 }),
    accountName: varchar("account_name", { length: 255 }),
    verificationStatus: verificationStatusEnum("verification_status").notNull().default("pending"),
    rejectionReason: varchar("rejection_reason", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("venue_provider_profiles_status_idx").on(t.verificationStatus)]
); 
