import { relations } from "drizzle-orm";
import { users } from "./users";
import { refreshTokens } from "./refresh-tokens";
import { otpRecords } from "./otp-records";
import { organizerProfiles, vendorProfiles, venueProfiles } from "./profiles";
import { categories } from "./categories";
import { vendorListings } from "./vendor-listings";
import { venues } from "./venues";
import { events } from "./events";
import { inquiries } from "./inquiries";
import { messages } from "./messages";
import { bookings } from "./bookings";
import { payments } from "./payments";
import { reviews } from "./reviews";
import { adminLogs } from "./admin-logs";

export const usersRelations = relations(users, ({ one, many }) => ({
  organizerProfile: one(organizerProfiles),
  vendorProfile: one(vendorProfiles),
  venueProviderProfile: one(venueProfiles),
  refreshTokens: many(refreshTokens),
  otpRecords: many(otpRecords),
  events: many(events),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const otpRecordsRelations = relations(otpRecords, ({ one }) => ({
  user: one(users, { fields: [otpRecords.userId], references: [users.id] }),
}));

export const organizerProfilesRelations = relations(
  organizerProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [organizerProfiles.userId],
      references: [users.id],
    }),
  }),
);

export const vendorProfilesRelations = relations(
  vendorProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [vendorProfiles.userId],
      references: [users.id],
    }),
    listings: many(vendorListings),
  }),
);

export const venueProviderProfilesRelations = relations(
  venueProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [venueProfiles.userId],
      references: [users.id],
    }),
    venues: many(venues),
  }),
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  vendorListings: many(vendorListings),
  venues: many(venues),
}));

export const vendorListingsRelations = relations(
  vendorListings,
  ({ one, many }) => ({
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
  }),
);

export const venuesRelations = relations(venues, ({ one, many }) => ({
  provider: one(venueProfiles, {
    fields: [venues.venueProfileId],
    references: [venueProfiles.id],
  }),
  venueType: one(categories, {
    fields: [venues.venueTypeId],
    references: [categories.id],
  }),
  inquiries: many(inquiries),
  bookings: many(bookings),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  inquiries: many(inquiries),
  bookings: many(bookings),
}));

export const inquiriesRelations = relations(inquiries, ({ one, many }) => ({
  organizer: one(users, {
    fields: [inquiries.organizerId],
    references: [users.id],
    relationName: "inquiryOrganizer",
  }),
  provider: one(users, {
    fields: [inquiries.providerId],
    references: [users.id],
    relationName: "inquiryProvider",
  }),
  event: one(events, { fields: [inquiries.eventId], references: [events.id] }),
  vendorListing: one(vendorListings, {
    fields: [inquiries.vendorListingId],
    references: [vendorListings.id],
  }),
  venue: one(venues, { fields: [inquiries.venueId], references: [venues.id] }),
  messages: many(messages, { relationName: "inquiryMessages" }),
  acceptedOffer: one(messages, {
    fields: [inquiries.acceptedOfferMessageId],
    references: [messages.id],
    relationName: "acceptedOffer",
  }),
  bookings: many(bookings),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  inquiry: one(inquiries, {
    fields: [messages.inquiryId],
    references: [inquiries.id],
    relationName: "inquiryMessages",
  }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
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
  event: one(events, { fields: [bookings.eventId], references: [events.id] }),
  inquiry: one(inquiries, {
    fields: [bookings.inquiryId],
    references: [inquiries.id],
  }),
  vendorListing: one(vendorListings, {
    fields: [bookings.vendorListingId],
    references: [vendorListings.id],
  }),
  venue: one(venues, { fields: [bookings.venueId], references: [venues.id] }),
  payments: many(payments),
  reviews: many(reviews),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewReviewer",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "reviewReviewee",
  }),
}));

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
  admin: one(users, { fields: [adminLogs.adminId], references: [users.id] }),
}));
