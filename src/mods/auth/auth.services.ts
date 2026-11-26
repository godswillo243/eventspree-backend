import type { ServiceReturnType } from "../../types/service";
import crypto from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "../../db/client";
import { otpRecords, refreshTokens, users } from "../../db/schema";
import type {
  ForgotPasswordInput,
  GoogleSigninInput,
  ResendEmailVerificationInput,
  ResetPasswordInput,
  SigninInput,
  SignupInput,
  VerifyEmailInput,
} from "./auth.schemas";
import { generateHash } from "../../utils/password";
import { HOUR } from "../../constants";
import {
  createSession,
  generateOtp,
  GRACE_MS,
  parseDuration,
  same,
  sha256,
  toPublicUser,
  upsertOTP,
  validateOtpRecord,
} from "./auth.utils";
import { verifyHash } from "../../utils/password";
import {
  signAccessJWT,
  signRefreshJWT,
  verifyRefreshJWT,
} from "../../utils/jwt";
import { logger } from "../../config/logger";
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
import type { User } from "../../db/types";
import type { PublicUser } from "../../types";

export async function signup(input: SignupInput): ServiceReturnType {
  const passwordHash = await generateHash(input.password);
  let newUser: User | undefined;

  try {
    newUser = (
      await db
        .insert(users)
        .values({ email: input.email, name: input.name, passwordHash })
        .returning()
    )[0];
    if (!newUser) {
      throw new Error("Error creating user");
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      if (newUser && !newUser.emailVerifiedAt) {
        [newUser] = await db
          .update(users)
          .set({
            passwordHash,
            name: input.name,
          })
          .where(
            and(eq(users.email, newUser.email), isNull(users.emailVerifiedAt)),
          )
          .returning();
      } else throw new ApiError(400, "Email already used.");
    } else throw error;
  }
  if (!newUser) throw new ApiError(500, "Error creating user");

  const [otp, otpHash] = generateOtp();

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
  await sendSignUpOtp(newUser.email, newUser.name ?? newUser.email, otp);

  return {
    statusCode: 201,
    message: "User created.",
    data: { user: newUser },
  };
}

export async function verifyEmail(input: VerifyEmailInput): ServiceReturnType {
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email));

  if (!user) {
    throw new ApiError(
      404,
      "User with email does not exist. Sign up to continue",
    );
  }
  if (user.emailVerifiedAt) {
    throw new ApiError(400, "Email already verified. Sign in to continue");
  }

  const [record] = await db
    .select()
    .from(otpRecords)
    .where(
      and(
        eq(otpRecords.type, "email_verification"),
        eq(otpRecords.userId, user.id),
      ),
    )
    .orderBy(desc(otpRecords.createdAt))
    .limit(1);

  const { ok, message, statusCode } = await validateOtpRecord(
    record,
    input.otp,
  );

  if (!ok || !record || !user) {
    throw new ApiError(statusCode || 401, message || "Invalid or expired OTP.");
  }
  const userId = user.id;

  await db.transaction(async (tx) => {
    const [consumed] = await tx
      .update(otpRecords)
      .set({ consumedAt: new Date() })
      .where(and(eq(otpRecords.id, record.id), isNull(otpRecords.consumedAt)))
      .returning({ id: otpRecords.id });
    if (!consumed) throw new ApiError(400, "Invalid or expired code.");

    [user] = await tx
      .update(users)
      .set({ emailVerifiedAt: new Date(Date.now()) })
      .where(eq(users.id, userId))
      .returning();
  });

  const { accessToken, refreshToken } = await createSession(user);
  await sendEmailVerified(
    user.email,
    user.name ?? user.email,
    `${env.CLIENT_URL}/home`,
  );

  return {
    statusCode: 200,
    message: "Email verified.",
    data: { accessToken, user: toPublicUser(user) },
    meta: { refreshToken },
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

  const [otp, otpHash] = generateOtp();

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

  return { message: responseMessage, data: null, statusCode: 200 };
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
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, input.email))
  )[0];
  if (!user) {
    throw new ApiError(400, "Invalid email or password.");
  }

  const DUMMY_HASH = await generateHash("not-a-real-password"); // module init
  const ok = await verifyHash(user?.passwordHash ?? DUMMY_HASH, input.password);
  if (!user || !user.passwordHash || !ok)
    throw new ApiError(400, "Invalid email or password.");
  if (!user.emailVerifiedAt)
    throw new ApiError(
      403,
      "Verify your email to continue." /* code: "EMAIL_NOT_VERIFIED" */,
      "EMAIL_NOT_VERIFIED",
    );
  if (user.status !== "active")
    throw new ApiError(403, "This account is unavailable.");

  if (!user.passwordHash) throw new ApiError(400, "Invalid email or password.");

  const { accessToken, refreshToken } = await createSession(user);

  return {
    data: { accessToken, user: { id: user.id, email: user.email } },
    message: "",
    statusCode: 200,
    meta: {
      refreshToken,
    },
  };
}

export async function signinWithGoogle(
  input: GoogleSigninInput,
): ServiceReturnType<{ accessToken: string; user: PublicUser }, string> {
  // 1. Exchange code + PKCE verifier (Google rejects a wrong verifier)
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      code_verifier: input.codeVerifier,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI, // must equal the one used in step 1
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!tokenRes.ok) {
    logger.warn(
      `${JSON.stringify({ status: tokenRes.status })}, google token exchange failed`,
    );
    throw new ApiError(400, "Google sign-in failed.");
  }
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new ApiError(400, "Google sign-in failed.");

  // 2. Profile. Fetched directly from Google over TLS with a token we just obtained,
  //    so no ID-token signature check is needed.
  const userRes = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: { Authorization: `Bearer ${access_token}` },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!userRes.ok) throw new ApiError(400, "Google sign-in failed.");

  const info = (await userRes.json()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!info.sub || !info.email || info.email_verified !== true) {
    throw new ApiError(400, "Your Google email is not verified.");
  }
  const email = info.email.trim().toLowerCase();

  // 3. Find → link → create
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleAuthId, info.sub))
    .limit(1);

  if (!user) {
    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (byEmail) {
      // Link. Google vouches for this email.
      // If the local account was never verified it may belong to a squatter, so drop their password.
      [user] = await db
        .update(users)
        .set({
          googleAuthId: info.sub,
          emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
          avatarUrl: byEmail.avatarUrl ?? info.picture,
          ...(byEmail.emailVerifiedAt ? {} : { passwordHash: null }),
        })
        .where(eq(users.id, byEmail.id))
        .returning();
    } else {
      [user] = await db
        .insert(users)
        .values({
          email,
          name: info.name,
          googleAuthId: info.sub,
          emailVerifiedAt: new Date(),
          avatarUrl: info.picture,
        })
        .returning(); // was missing, so new Google users used to get a 500
    }
  }
  if (!user) throw new ApiError(500, "Error creating user");

  // 4. Same gate as password signin
  if (user.status !== "active") {
    throw new ApiError(
      403,
      "This account is unavailable.",
      /* code: */ "ACCOUNT_DISABLED",
    );
  }

  const { accessToken, refreshToken } = await createSession(user);
  return {
    statusCode: 200,
    message: "Signed in.",
    data: { accessToken, user: toPublicUser(user) },
    meta: { refreshToken },
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

  const [otp, otpHash] = generateOtp();

  await upsertOTP({
    expiresAt: new Date(Date.now() + HOUR),
    codeHash: otpHash,
    type: "password_reset",
    userId: user.id,
    maxAttempts: 5,
  });

  // TODO: Send otp to email
  if (env.NODE_ENV === "development")
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
    throw new ApiError(400, "Invalid or expired code.");
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

  await db.transaction(async (tx) => {
    const [consumed] = await tx
      .update(otpRecords)
      .set({ consumedAt: new Date() })
      .where(and(eq(otpRecords.id, record.id), isNull(otpRecords.consumedAt)))
      .returning({ id: otpRecords.id });
    if (!consumed) throw new ApiError(400, "Invalid or expired code.");

    await tx
      .update(users)
      .set({ passwordHash /* or emailVerifiedAt */ })
      .where(eq(users.id, user.id));
    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, user.id));
  });

  await sendPasswordResetSuccess(
    user.email,
    user.email,
    `${env.CLIENT_URL}/signin`,
  );

  return {
    message: responseMessage,
    statusCode: 200,
    data: { email: user.email },
  };
}

export async function refresh(token: string): ServiceReturnType {
  const payload = token ? verifyRefreshJWT(token) : null;
  if (!token || !payload) throw new ApiError(401, "Invalid refresh token.");

  const [session] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.id, payload.sessionId));
  if (!session || session.revokedAt || session.expiresAt < new Date())
    throw new ApiError(401, "Invalid refresh token.");

  const hash = sha256(token);
  const isCurrent = same(session.tokenHash, hash);
  const isGraceHit =
    !isCurrent &&
    same(session.previousTokenHash, hash) &&
    !!session.rotatedAt &&
    Date.now() - session.rotatedAt.getTime() < GRACE_MS;

  if (!isCurrent && !isGraceHit) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.familyId, session.familyId)); // genuine reuse
    throw new ApiError(401, "Invalid refresh token.");
  }

  const isValid = same(session.tokenHash, hash);
  console.log(isValid);
  if (!isValid) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.familyId, session.familyId));
    throw new ApiError(401, "Invalid refresh token.");
  }

  const [user] = await db
    .select({
      id: users.id,
      role: users.role,
      status: users.status,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, session.userId));
  if (!user || user.status !== "active" || !user.emailVerifiedAt)
    throw new ApiError(401, "Invalid refresh token."); // 401, not 404

  const accessToken = signAccessJWT({ role: user.role, userId: user.id });
  if (isGraceHit)
    return { data: { accessToken }, message: "", statusCode: 200 };

  const refreshToken = signRefreshJWT({
    sessionId: session.id,
    userId: user.id,
    familyId: session.familyId,
    jti: crypto.randomUUID(),
  });

  const rotated = await db
    .update(refreshTokens)
    .set({
      previousTokenHash: session.tokenHash,
      rotatedAt: new Date(),
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + parseDuration(env.JWT_REFRESH_EXPIRES)),
    })
    .where(
      and(
        eq(refreshTokens.id, session.id),
        eq(refreshTokens.tokenHash, session.tokenHash),
      ),
    )
    .returning({ id: refreshTokens.id });

  if (!rotated.length)
    return { data: { accessToken }, message: "", statusCode: 200 };
  return {
    data: { accessToken },
    message: "",
    statusCode: 200,
    meta: { refreshToken },
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
  const user = (await db.select().from(users).where(eq(users.id, userId)))[0];

  if (!user) throw new ApiError(404, "User not found.");

  return {
    message: "",
    data: {
      user: toPublicUser(user),
    },
    statusCode: 200,
  };
}
