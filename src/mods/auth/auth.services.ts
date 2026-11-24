import { and, desc, eq } from "drizzle-orm";
import { generate } from "otp-generator";
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
import { generateHash } from "../../utils/password";
import { HOUR } from "../../constants";
import { parseDuration, upsertOTP, validateOtpRecord } from "./auth.utils";
import { verifyHash } from "../../utils/password";
import { logger } from "../../config/logger";
import {
  signAccessJWT,
  signRefreshJWT,
  verifyRefreshJWT,
} from "../../utils/jwt";
import crypto from "crypto";
import { env } from "../../config/env";
import {
  sendSignUpOtp,
  sendResendVerificationOTP,
  sendEmailVerified,
  sendForgotPassword,
  sendPasswordResetSuccess,
} from "../../lib/email";
import { ApiError } from "../../utils/api-error";
import { isUniqueViolation } from "../../utils/unique-violation";

type ServiceReturnType<TData = unknown, TMeta = unknown> = Promise<{
  statusCode: number;
  message: string;
  data: TData;
  meta?: Record<string, TMeta>;
}>;

export async function signup(input: SignupInput): ServiceReturnType {
  const passwordHash = await generateHash(input.password);
  let newUser:
    | {
        email: string;
        id: string;
        name: string | null;
      }
    | undefined;

  try {
    newUser = (
      await db
        .insert(users)
        .values({ email: input.email, passwordHash })
        .returning({ email: users.email, id: users.id, name: users.name })
    )[0];
    if (!newUser) {
      throw new Error("Error creating user");
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(400, "Email already used.");
    }
    throw new ApiError(500, "Error creating user");
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

  if (env.NODE_ENV !== "production") {
    logger.info(`OTP for ${input.email}: ${otp}`);
  }
  await sendSignUpOtp(newUser.email, newUser.email, otp);

  return {
    statusCode: 201,
    message: "User created.",
    data: { user: newUser },
  };
}

export async function verifyEmail(input: VerifyEmailInput): ServiceReturnType {
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
    throw new ApiError(
      404,
      "User with email does not exist. Sign up to continue",
    );
  }
  if (user.emailVerifiedAt) {
    throw new ApiError(400, "Email already verified. Sign in to continue");
  }

  const record =
    (
      await db
        .select()
        .from(otpRecords)
        .where(
          and(
            eq(otpRecords.type, "email_verification"),
            eq(otpRecords.userId, user.id),
          ),
        )
        .orderBy(desc(otpRecords.createdAt))
        .limit(1)
    )[0] || null;

  const { ok, message, statusCode } = await validateOtpRecord(
    record,
    input.otp,
  );

  if (!ok || !record) {
    throw new ApiError(statusCode || 401, message || "Invalid or expired OTP.");
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

  if (!updatedUser) throw new ApiError(500, "Something went wrong");

  await sendEmailVerified(
    user.email,
    user.email,
    `${env.CLIENT_URL}/dashboard`,
  );

  await db
    .update(otpRecords)
    .set({ consumedAt: new Date() })
    .where(eq(otpRecords.id, record.id));

  return {
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
  const responseMessage =
    "If an account exists with this email, you'll receive an otp.  Please check your inbox (and spam folder).";

  if (!user) {
    return {
      data: null,
      message: responseMessage,
      statusCode: 200,
    };
  }

  if (user.emailVerifiedAt) {
    throw new ApiError(400, "Email already verified. Sign in to continue");
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
    userId: user.id,
    maxAttempts: 5,
  });
  if (env.NODE_ENV !== "production") {
    logger.info("OTP for " + input.email + ": " + otp);
  }
  await sendResendVerificationOTP(user.email, user.email, otp);

  return { message: responseMessage, data: user, statusCode: 200 };
}

export async function signin(input: SigninInput): ServiceReturnType {
  const user = (
    await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        emailVerifiedAt: users.emailVerifiedAt,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, input.email))
  )[0];
  if (!user) {
    throw new ApiError(400, "Invalid email or password.");
  }

  if (!user.emailVerifiedAt)
    throw new ApiError(400, "Email not verified. Please verify your email.");

  if (!user.passwordHash)
    throw new ApiError(400, "Password not set for this account.");

  const isMatch = await verifyHash(user.passwordHash, input.password);
  if (!isMatch) throw new ApiError(400, "Invalid email or password.");

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
  });
  const expiresAt = new Date(
    Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES),
  );
  const refreshTokenHash = await generateHash(refreshToken);

  await db.insert(refreshTokens).values({
    expiresAt,
    tokenHash: refreshTokenHash,
    userId: user.id,
    id: sessionId,
    familyId,
  });

  return {
    data: { accessToken, user: { id: user.id, email: user.email } },
    message: "",
    statusCode: 200,
    meta: {
      refreshToken,
    },
  };
}

export async function signinWithGoogle(input: { code?: string }) {
  if (!input.code)
    throw new ApiError(
      400,
      "Missing code",
      undefined,
      undefined,
      `${env.CLIENT_URL}/google/callback`,
    );

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    logger.error(await tokenRes.text());
    throw new ApiError(
      500,
      "Token exchange failed",
      undefined,
      undefined,
      `${env.CLIENT_URL}/google/callback`,
    );
  }

  const { access_token, id_token } = (await tokenRes.json()) as Record<
    string,
    string
  >;

  const userRes = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${access_token}` },
    },
  );

  if (!userRes.ok) {
    logger.error(await userRes.text());
    throw new ApiError(
      500,
      "Failed to fetch google user",
      undefined,
      undefined,
      `${env.CLIENT_URL}/google/callback`,
    );
  }

  const user = (await userRes.json()) as {
    sub: string;
    name: string;
    email: string;
  }; // { sub, name, email, picture, ... }

  console.log(user);

  let dbUser = (
    await db
      .select()
      .from(users)
      .where(and(eq(users.email, user.email), eq(users.googleAuthId, user.sub)))
      .limit(1)
  )[0];

  if (!dbUser) {
    dbUser = (
      await db
        .insert(users)
        .values({ email: user.email, name: user.name, googleAuthId: user.sub })
    )[0];
  }

  if (!dbUser) {
    throw new ApiError(500, "Error creating user");
  }

  const accessToken = signAccessJWT({
    role: dbUser.role,
    userId: dbUser.id,
  });

  const sessionId = crypto.randomUUID().toString();
  const familyId = crypto.randomUUID().toString();
  const refreshToken = signRefreshJWT({
    sessionId,
    userId: dbUser.id,
    familyId,
  });
  const expiresAt = new Date(
    Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES),
  );
  const refreshTokenHash = await generateHash(refreshToken);

  await db.insert(refreshTokens).values({
    expiresAt,
    tokenHash: refreshTokenHash,
    userId: dbUser.id,
    id: sessionId,
    familyId,
  });

  return {
    data: { accessToken, user: { id: dbUser.id, email: user.email } },
    message: "",
    statusCode: 200,
    meta: {
      refreshToken,
    },
  };
}

export async function forgotPassword(
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
    return { message: responseMessage, data: {}, statusCode: 200 };
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

  return { message: responseMessage, data: {}, statusCode: 200 };
}

export async function resetPassword(
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

  const responseMessage = "Password reset.";

  if (!user) {
    return { message: responseMessage, data: {}, statusCode: 200 };
  }

  const record =
    (
      await db
        .select()
        .from(otpRecords)
        .where(
          and(
            eq(otpRecords.type, "password_reset"),
            eq(otpRecords.userId, user.id),
          ),
        )
        .orderBy(desc(otpRecords.createdAt))
        .limit(1)
    )[0] || null;

  const { ok, message, statusCode } = await validateOtpRecord(
    record,
    input.otp,
  );

  if (!ok || !record) {
    throw new ApiError(statusCode || 400, message || "Invalid or expired OTP.");
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
    throw new ApiError(
      500,
      "Something went wrong. Error updating user password.",
    );

  await db
    .update(otpRecords)
    .set({ consumedAt: new Date() })
    .where(eq(otpRecords.id, record.id));

  await sendPasswordResetSuccess(
    user.email,
    user.email,
    `${env.CLIENT_URL}/login`,
  );

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.userId, user.id));

  return {
    message: responseMessage,
    statusCode: 200,
    data: { email: user.email },
  };
}

export async function refresh(token: string): ServiceReturnType {
  const payload = verifyRefreshJWT(token);
  if (!payload) {
    throw new ApiError(401, "Invalid refresh token.");
  }

  const session = (
    await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, payload.sessionId))
  )[0];

  if (!session || session.revokedAt) {
    throw new ApiError(401, "Invalid refresh token.");
  }

  if (session.expiresAt < new Date())
    throw new ApiError(
      401,
      "Session has expired. Sign in to create a new one.",
    );

  const isValid = await verifyHash(session.tokenHash, token);
  if (!isValid) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.familyId, session.familyId));
    throw new ApiError(401, "Invalid refresh token.");
  }

  const user = (
    await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, session.userId))
  )[0];
  if (!user) throw new ApiError(404, "User not found.");

  const accessToken = signAccessJWT({
    role: user.role,
    userId: user.id,
  });

  const sessionId = session.id;

  const refreshToken = signRefreshJWT({
    sessionId,
    userId: user.id,
    familyId: session.familyId,
  });
  const expiresAt = new Date(
    Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES),
  );

  const refreshTokenHash = await generateHash(refreshToken);

  await db
    .update(refreshTokens)
    .set({
      expiresAt,
      tokenHash: refreshTokenHash,
    })
    .where(eq(refreshTokens.id, sessionId));

  return {
    data: { accessToken },
    message: "",
    statusCode: 200,
    meta: {
      refreshToken,
    } as const,
  };
}

export async function logout(token: string): ServiceReturnType {
  const payload = verifyRefreshJWT(token);

  if (!payload)
    return {
      data: null,
      message: "Log out successful.",
      statusCode: 200,
    };

  await db
    .delete(refreshTokens)
    .where(eq(refreshTokens.familyId, payload.familyId));

  return {
    data: null,
    message: "Log out successful.",
    statusCode: 200,
  };
}

export async function getAuthUser(userId: string): ServiceReturnType {
  const user = (
    await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        status: users.status,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
  )[0];

  if (!user) throw new ApiError(404, "User not found.");

  return {
    message: "",
    data: {
      user,
    },
    statusCode: 200,
  };
}
