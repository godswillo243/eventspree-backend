import { relations } from "drizzle-orm";
import { organizerProfiles, vendorProfiles, venueProviderProfiles } from "./profiles";
import { vendorListings } from "./vendor-listings";
import { users } from "./users";
import { refreshTokens } from "./refresh-tokens";
import { events } from "./events";
import { inquiries } from "./inquiries";
import { messages } from "./messages";
import { bookings } from "./bookings";
import { reviews } from "./reviews";
import { adminLogs } from "./admin-logs";
import { categories } from "./categories";
import { venues } from "./venues";
import { payments } from "./payments";
import { otpRecords } from "./otp-records";

// ── USERS ──────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  organizerProfile: one(organizerProfiles, {
    fields: [users.id],
    references: [organizerProfiles.userId],
  }),
  vendorProfile: one(vendorProfiles, {
    fields: [users.id],
    references: [vendorProfiles.userId],
  }),
  venueProviderProfile: one(venueProviderProfiles, {
    fields: [users.id],
    references: [venueProviderProfiles.userId],
  }),
  refreshTokens: many(refreshTokens),
  eventsAsOrganizer: many(events),
  inquiriesAsOrganizer: many(inquiries),
  messagesSent: many(messages),
  bookingsAsOrganizer: many(bookings, { relationName: "bookingOrganizer" }),
  bookingsAsProvider: many(bookings, { relationName: "bookingProvider" }),
  reviewsWritten: many(reviews),
  adminLogsCreated: many(adminLogs),
  otpRecords: many(otpRecords),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

// ── ORGANIZER PROFILE ──────────────────────────
export const organizerProfilesRelations = relations(organizerProfiles, ({ one }) => ({
  user: one(users, { fields: [organizerProfiles.userId], references: [users.id] }),
}));

// ── VENDOR PROFILE ─────────────────────────────
export const vendorProfilesRelations = relations(vendorProfiles, ({ one, many }) => ({
  user: one(users, { fields: [vendorProfiles.userId], references: [users.id] }),
  listings: many(vendorListings),
}));

// ── VENDOR LISTINGS ────────────────────────────
export const vendorListingsRelations = relations(vendorListings, ({ one, many }) => ({
  vendorProfile: one(vendorProfiles, {
    fields: [vendorListings.vendorProfileId],
    references: [vendorProfiles.id],
  }),
  category: one(categories, {
    fields: [vendorListings.categoryId],
    references: [categories.id],
  }),
  inquiries: many(inquiries),
  bookings: many(bookings),
  reviews: many(reviews),
}));

// ── VENUE PROVIDER PROFILE ─────────────────────
export const venueProviderProfilesRelations = relations(venueProviderProfiles, ({ one, many }) => ({
  user: one(users, { fields: [venueProviderProfiles.userId], references: [users.id] }),
  venues: many(venues),
}));

// ── VENUES ──────────────────────────────────────
export const venuesRelations = relations(venues, ({ one, many }) => ({
  venueProvider: one(venueProviderProfiles, {
    fields: [venues.venueProviderId],
    references: [venueProviderProfiles.id],
  }),
  venueType: one(categories, { fields: [venues.venueTypeId], references: [categories.id] }),
  inquiries: many(inquiries),
  bookings: many(bookings),
  reviews: many(reviews),
}));

// ── CATEGORIES ──────────────────────────────────
export const categoriesRelations = relations(categories, ({ many }) => ({
  vendorListings: many(vendorListings),
  venues: many(venues),
}));

// ── EVENTS ──────────────────────────────────────
export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, { fields: [events.organizerId], references: [users.id] }),
  inquiries: many(inquiries),
  bookings: many(bookings),
}));

// ── INQUIRIES ───────────────────────────────────
export const inquiriesRelations = relations(inquiries, ({ one, many }) => ({
  event: one(events, { fields: [inquiries.eventId], references: [events.id] }),
  organizer: one(users, { fields: [inquiries.organizerId], references: [users.id] }),
  vendorListing: one(vendorListings, {
    fields: [inquiries.vendorListingId],
    references: [vendorListings.id],
  }),
  venue: one(venues, { fields: [inquiries.venueId], references: [venues.id] }),
  acceptedOfferMessage: one(messages, {
    fields: [inquiries.acceptedOfferMessageId],
    references: [messages.id],
  }),
  messages: many(messages),
  booking: one(bookings, { fields: [inquiries.id], references: [bookings.inquiryId] }),
}));

// ── MESSAGES ────────────────────────────────────
export const messagesRelations = relations(messages, ({ one }) => ({
  inquiry: one(inquiries, { fields: [messages.inquiryId], references: [inquiries.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

// ── BOOKINGS ────────────────────────────────────
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  inquiry: one(inquiries, { fields: [bookings.inquiryId], references: [inquiries.id] }),
  event: one(events, { fields: [bookings.eventId], references: [events.id] }),
  organizer: one(users, {
    fields: [bookings.organizerId],
    references: [users.id],
    relationName: "bookingOrganizer",
  }),
  provider: one(users, {
    fields: [bookings.providerId],
    references: [users.id],
    relationName: "bookingProvider",
  }),
  vendorListing: one(vendorListings, {
    fields: [bookings.vendorListingId],
    references: [vendorListings.id],
  }),
  venue: one(venues, { fields: [bookings.venueId], references: [venues.id] }),
  payments: many(payments),
  reviews: many(reviews),
}));

// ── PAYMENTS ────────────────────────────────────
export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  payer: one(users, { fields: [payments.payerId], references: [users.id] }),
}));

// ── REVIEWS ─────────────────────────────────────
export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, { fields: [reviews.bookingId], references: [bookings.id] }),
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id] }),
  vendorListing: one(vendorListings, {
    fields: [reviews.vendorListingId],
    references: [vendorListings.id],
  }),
  venue: one(venues, { fields: [reviews.venueId], references: [venues.id] }),
}));

// ── ADMIN LOGS ──────────────────────────────────
export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  admin: one(users, { fields: [adminLogs.adminId], references: [users.id] }),
}));

// ── OTP RECORDS ─────────────────────────────────
export const otpRecordsRelations = relations(otpRecords, ({ one }) => ({
  user: one(users, { fields: [otpRecords.userId], references: [users.id] }),
}));
