import { eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  vendorProfiles,
  organizerProfiles,
  venueProviderProfiles,
} from "../db/schema";

export async function getUserProfiles(userId: string) {
  const vendorProfile = (
    await db
      .select({ id: vendorProfiles.id })
      .from(vendorProfiles)
      .where(eq(vendorProfiles.userId, userId))
  )[0];

  const venueProviderProfile = (
    await db
      .select({ id: venueProviderProfiles.id })
      .from(venueProviderProfiles)
      .where(eq(venueProviderProfiles.userId, userId))
  )[0];

  const organizerProfile = (
    await db
      .select({ id: organizerProfiles.id })
      .from(organizerProfiles)
      .where(eq(organizerProfiles.userId, userId))
  )[0];

  return { vendorProfile, venueProviderProfile, organizerProfile };
}
