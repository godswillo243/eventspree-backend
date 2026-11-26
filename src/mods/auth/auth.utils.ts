import type { StringValue } from "ms";
import type { Response } from "express";
import { createHash, timingSafeEqual } from "crypto";
import { and, eq } from "drizzle-orm";
import { generate } from "otp-generator";

import { env } from "../../config/env";
import { MS_MAP } from "../../constants";
import type { OTPRecord, OTPType, User, UserRole } from "../../db/types";
import { db } from "../../db/client";
import { otpRecords, refreshTokens } from "../../db/schema";
import { signAccessJWT, signRefreshJWT } from "../../utils/jwt";

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

export const sha256 = (s: string) =>
  createHash("sha256").update(s).digest("hex");

export const same = (a?: string | null, b?: string | null) =>
  !!a &&
  !!b &&
  a.length === b.length &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));

export const GRACE_MS = 10_000;
export const generateOtp = () => {
  const otp = generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    specialChars: false,
    upperCaseAlphabets: false,
  });

  const hash = sha256(otp);

  return [otp, hash] as const;
};

export async function validateOtpRecord(
  record: OTPRecord | null | undefined,
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

  const hash = sha256(inputOtp);
  const isMatch = await same(record.codeHash, hash);
  if (!isMatch) {
    await db
      .update(otpRecords)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpRecords.id, record.id));
    return { ok: false, message: "Invalid OTP.", statusCode: 400 };
  }
  return { ok: true };
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
} as const;

export const setAuthCookies = (
  res: Response,
  access: string,
  refresh?: string,
) => {
  res.cookie("accessToken", access, {
    ...cookieOpts,
    maxAge: parseDuration(env.JWT_ACCESS_EXPIRES),
  });
  if (refresh)
    res.cookie("refreshToken", refresh, {
      ...cookieOpts,
      maxAge: parseDuration(env.JWT_REFRESH_EXPIRES),
    });
};
export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", cookieOpts);
  res.clearCookie("refreshToken", cookieOpts);
};

export const createSession = async (user: { id: string; role: UserRole }) => {
  const accessToken = signAccessJWT({
    role: user.role,
    userId: user.id,
  });

  const sessionId = crypto.randomUUID().toString();
  const familyId = crypto.randomUUID().toString();
  const refreshToken = signRefreshJWT({
    sessionId,
    userId: user.id,
    familyId,
    jti: crypto.randomUUID(),
  });
  const expiresAt = new Date(
    Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES),
  );
  const refreshTokenHash = await sha256(refreshToken);

  await db.insert(refreshTokens).values({
    expiresAt,
    tokenHash: refreshTokenHash,
    userId: user.id,
    id: sessionId,
    familyId,
  });

  return { accessToken, refreshToken };
};

export const toPublicUser = (user: User) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
  };
};
