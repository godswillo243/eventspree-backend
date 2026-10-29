import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { otpRecords, refreshTokens, users } from "../../db/schema";
import type {
  ForgotPasswordInput,
  ResendEmailVerificationInput,
  ResetPasswordInput,
  SigninInput,
  SignupInput,
  VerifyEmailInput,
} from "./auth.schemas";
import { AppError } from "../../lib/api-error";
import { generateHash } from "../../lib/password";
import { generate } from "otp-generator";
import { DAY, HOUR, MINUTE, MS_MAP, SECOND } from "../../constants";
import { upsertOTP } from "./auth.utils";
import { verifyHash } from "../../lib/password";
import { logger } from "../../config/logger";
import { signAccessJWT, signRefreshJWT } from "../../lib/jwt";
import crypto from "crypto";
import { env } from "../../config/env";
import {
  sendSignUpOtp,
  sendResendVerificationOTP,
  sendEmailVerified,
  sendForgotPassword,
  sendPasswordResetSuccess,
} from "../../lib/email";

type ServiceReturnType<TData = unknown, TMeta = unknown> = Promise<
  | {
      ok: true;
      statusCode: number;
      message: string;
      data: TData;
      meta?: Record<string, TMeta>;
    }
  | {
      ok: false;
      statusCode: number;
      message: string;
      error?: unknown;
    }
>;

export async function signupService(input: SignupInput): ServiceReturnType {
  const existingUsers = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.email, input.email));

  if (existingUsers.length > 0) {
    return {
      ok: false,
      statusCode: 400,
      message: "Email already used",
      error: true,
    };
  }

  const passwordHash = await generateHash(input.password);

  const newUser = (
    await db
      .insert(users)
      .values({ email: input.email, passwordHash })
      .returning({ email: users.email, id: users.id })
  )[0];

  if (!newUser) {
    throw new AppError("Error creating user", 500);
  }

  const otp = generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    specialChars: false,
    upperCaseAlphabets: false,
  });

  const otpHash = await generateHash(otp);

  await upsertOTP({
    expiresAt: new Date(Date.now() + HOUR),
    codeHash: otpHash,
    type: "email_verification",
    userId: newUser.id,
    maxAttempts: 5,
  });

  // TODO: Send otp to email
  logger.info("OTP for " + input + ": " + otp);
  await sendSignUpOtp(newUser.email, newUser.email, otp);

  return {
    ok: true,
    statusCode: 201,
    message: "User created.",
    data: { user: newUser },
  };
}

export async function verifyEmailService(
  input: VerifyEmailInput,
): ServiceReturnType {
  const user = (
    await db
      .select({
        id: users.id,
        emailVerifiedAt: users.emailVerifiedAt,
        email: users.email,
      })
      .from(users)
      .where(eq(users.email, input.email))
  )[0];

  if (!user) {
    return {
      ok: false,
      message: "User with email does not exist. Sign up to continue.",
      statusCode: 404,
    };
  }
  if (user.emailVerifiedAt) {
    return {
      ok: false,
      message: "Email already verified. Sign in to continue",
      statusCode: 400,
    };
  }

  const record = (
    await db
      .select()
      .from(otpRecords)
      .where(
        and(
          eq(otpRecords.type, "email_verification"),
          eq(otpRecords.userId, user.id),
        ),
      )
  )[0];

  if (!record) {
    return {
      ok: false,
      message: "Invalid OTP. Request for another",
      statusCode: 400,
    };
  }

  if (record.attempts > record.maxAttempts) {
    return {
      ok: false,
      message: "Max attempts reached. Please request for another otp",
      statusCode: 400,
    };
  }

  const isMatch = await verifyHash(record.codeHash, input.otp);
  if (!isMatch) {
    await db
      .update(otpRecords)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpRecords.id, record.id));
    return { ok: false, message: "Invalid OTP.", statusCode: 400 };
  }
  if (record.expiresAt <= new Date(Date.now())) {
    return {
      ok: false,
      message: "OTP expired. Please request for another otp",
      statusCode: 400,
    };
  }

  if (record.consumedAt) {
    return {
      ok: false,
      message: "OTP already used. Please request for anther one.",
      statusCode: 400,
    };
  }

  const updatedUser = (
    await db
      .update(users)
      .set({
        emailVerifiedAt: new Date(Date.now()),
      })
      .returning({ email: users.email, id: users.id })
      .where(eq(users.email, input.email))
  )[0];

  if (!updatedUser) throw new Error("Something went wrong");

  await sendEmailVerified(user.email, user.email, "");

  await db
    .update(otpRecords)
    .set({ consumedAt: new Date() })
    .where(eq(otpRecords.id, record.id));

  return {
    ok: true,
    message: "Email verified.",
    statusCode: 200,
    data: updatedUser,
  };
}

export async function resendEmailVerificationOTP(
  input: ResendEmailVerificationInput,
): ServiceReturnType {
  const user = (
    await db
      .select({
        email: users.email,
        id: users.id,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .where(eq(users.email, input.email))
  )[0];

  if (!user) {
    return { ok: false, message: "User not found", statusCode: 404 };
  }

  if (user.emailVerifiedAt) {
    return {
      ok: false,
      message: "Email already verified. Sign in to continue",
      statusCode: 400,
    };
  }

  const otp = generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    specialChars: false,
    upperCaseAlphabets: false,
  });

  const otpHash = await generateHash(otp);

  const otpRecord = await upsertOTP({
    expiresAt: new Date(Date.now() + HOUR),
    codeHash: otpHash,
    type: "email_verification",
    userId: user.id,
    maxAttempts: 5,
  });

  // TODO: Send otp to email
  logger.info("OTP for " + input.email + ": " + otp);
  await sendResendVerificationOTP(user.email, user.email, otp);

  return { ok: true, message: "Email sent.", data: user, statusCode: 200 };
}

export async function signinService(input: SigninInput): ServiceReturnType {
  const user = (
    await db.select().from(users).where(eq(users.email, input.email))
  )[0];
  if (!user) {
    return {
      ok: false,
      message: "Invalid email or password.",
      statusCode: 400,
    };
  }

  if (!user.emailVerifiedAt)
    return {
      ok: false,
      message: "Email not verified. Please verify your email.",
      statusCode: 400,
    };

  if (!user.passwordHash)
    return {
      ok: false,
      message: "Password not set for this user.",
      statusCode: 400,
    };

  const isMatch = await verifyHash(user.passwordHash, input.password);
  if (!isMatch)
    return {
      ok: false,
      message: "Invalid email or password.",
      statusCode: 400,
    };

  const accessToken = signAccessJWT({
    role: user.role,
    userId: user.id,
  });

  const sessionId = crypto.randomUUID().toString();

  const refreshToken = signRefreshJWT({
    sessionId,
    userId: user.id,
  });

  const refreshTokenHash = await generateHash(refreshToken);

  await db.insert(refreshTokens).values({
    expiresAt: new Date(
      Date.now() +
        parseInt(env.JWT_REFRESH_EXPIRES) *
          MS_MAP[
            env.JWT_REFRESH_EXPIRES[
              env.JWT_REFRESH_EXPIRES.length - 1
            ] as keyof typeof MS_MAP
          ],
    ),
    tokenHash: refreshTokenHash,
    userId: user.id,
    id: sessionId,
  });

  return {
    ok: true,
    data: { accessToken, user: { id: user.id, email: user.email } },
    message: "",
    statusCode: 200,
    meta: {
      refreshToken,
    },
  };
}

export async function forgotPasswordService(
  input: ForgotPasswordInput,
): ServiceReturnType {
  const user = (
    await db
      .select({
        email: users.email,
        id: users.id,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .where(eq(users.email, input.email))
  )[0];

  const responseMessage =
    "If an account exists with this email, you'll receive an otp.  Please check your inbox (and spam folder).";

  if (!user) {
    return { ok: true, message: responseMessage, data: {}, statusCode: 200 };
  }

  const otp = generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    specialChars: false,
    upperCaseAlphabets: false,
  });

  const otpHash = await generateHash(otp);

  await upsertOTP({
    expiresAt: new Date(Date.now() + HOUR),
    codeHash: otpHash,
    type: "password_reset",
    userId: user.id,
    maxAttempts: 5,
  });

  // TODO: Send otp to email
  logger.info("OTP for " + input.email + ": " + otp);
  await sendForgotPassword(user.email, user.email, otp);

  return { ok: true, message: responseMessage, data: {}, statusCode: 200 };
}

export async function resetPasswordService(
  input: ResetPasswordInput,
): ServiceReturnType {
  const user = (
    await db
      .select({
        id: users.id,
        emailVerifiedAt: users.emailVerifiedAt,
        email: users.email,
      })
      .from(users)
      .where(eq(users.email, input.email))
  )[0];

  if (!user) {
    return {
      ok: false,
      message: "User with email does not exist. Sign up to continue.",
      statusCode: 404,
    };
  }

  const record = (
    await db
      .select()
      .from(otpRecords)
      .where(
        and(
          eq(otpRecords.type, "password_reset"),
          eq(otpRecords.userId, user.id),
        ),
      )
  )[0];

  if (!record) {
    return {
      ok: false,
      message: "Invalid OTP. Request for another",
      statusCode: 400,
    };
  }

  if (record.attempts > record.maxAttempts) {
    return {
      ok: false,
      message: "Max attempts reached. Please request for another otp",
      statusCode: 400,
    };
  }
  if (record.expiresAt <= new Date(Date.now())) {
    return {
      ok: false,
      message: "OTP expired. Please request for another otp",
      statusCode: 400,
    };
  }

  if (record.consumedAt) {
    return {
      ok: false,
      message: "OTP already used. Please request for anther one.",
      statusCode: 400,
    };
  }

  const isMatch = await verifyHash(record.codeHash, input.otp);
  if (!isMatch) {
    await db
      .update(otpRecords)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpRecords.id, record.id));
    return { ok: false, message: "Invalid OTP.", statusCode: 400 };
  }

  const passwordHash = await generateHash(input.newPassword);

  const updatedUser = (
    await db
      .update(users)
      .set({
        passwordHash,
      })
      .returning({ email: users.email, id: users.id })
      .where(eq(users.email, user.email))
  )[0];

  if (!updatedUser)
    throw new Error("Something went wrong. Error updating user password.");

  await db
    .update(otpRecords)
    .set({ consumedAt: new Date() })
    .where(eq(otpRecords.id, record.id));
  await sendPasswordResetSuccess(user.email, user.email, "");

  return {
    ok: true,
    message: "Password reset.",
    statusCode: 200,
    data: null,
  };
}
