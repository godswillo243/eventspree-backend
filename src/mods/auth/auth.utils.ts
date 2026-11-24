import type { OTPRecord, OTPType } from "../../db/types";
import { db } from "../../db/client";
import { otpRecords } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { verifyHash } from "../../utils/password";
import { env } from "../../config/env";
import { MS_MAP } from "../../constants";
import type { StringValue } from "ms";

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
  await db
    .delete(otpRecords)
    .where(and(eq(otpRecords.userId, userId), eq(otpRecords.type, type)));

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

export async function validateOtpRecord(
  record: OTPRecord | null,
  inputOtp: string,
) {
  if (!record)
    return {
      ok: false,
      message: "Invalid OTP. Request a new one.",
      statusCode: 400,
    };
  if (record.attempts >= record.maxAttempts)
    return { ok: false, message: "Max attempts reached.", statusCode: 400 };
  if (record.expiresAt <= new Date())
    return { ok: false, message: "OTP expired.", statusCode: 400 };
  if (record.consumedAt)
    return { ok: false, message: "OTP already used.", statusCode: 400 };

  const isMatch = await verifyHash(record.codeHash, inputOtp);
  if (!isMatch) {
    await db
      .update(otpRecords)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpRecords.id, record.id));
    return { ok: false, message: "Invalid OTP.", statusCode: 400 };
  }
  return { ok: true };
}

export function getRefreshExpiry(): Date {
  const raw = env.JWT_REFRESH_EXPIRES;
  const unit = raw[raw.length - 1] as keyof typeof MS_MAP;
  return new Date(Date.now() + parseInt(raw) * MS_MAP[unit]);
}
export function parseDuration(value: string | StringValue): number {
  return (
    parseInt(value) * MS_MAP[value[value.length - 1] as keyof typeof MS_MAP]
  );
}
