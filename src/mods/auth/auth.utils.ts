import type { OTPType } from "../../db/types";
import { db } from "../../db/client";
import { otpRecords } from "../../db/schema";
import { and, eq, ne } from "drizzle-orm";

export async function upsertOTP({
  expiresAt,
  codeHash,
  type,
  userId,
  maxAttempts = 5,
}: {
  userId: string;
  codeHash: string;
  type: OTPType;
  expiresAt: Date;
  maxAttempts?: number;
}) {
  const existingRecords = await db
    .select({ id: otpRecords.id })
    .from(otpRecords)
    .where(and(eq(otpRecords.userId, userId), eq(otpRecords.type, type)));

  if (existingRecords.length > 0) {
    await db
      .delete(otpRecords)
      .where(and(eq(otpRecords.userId, userId), eq(otpRecords.type, type)));
  }

  const newRecord = (
    await db
      .insert(otpRecords)
      .values({
        codeHash,
        expiresAt,
        type,
        userId,
        maxAttempts,
      })
      .returning()
  )[0];
  return newRecord;
}
