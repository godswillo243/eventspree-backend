import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../db/types";
import type { StringValue } from "ms";

type JWTPayload = {
  userId: string;
  role: UserRole;
};

interface RefreshJWTPayload {
  userId: string;
  sessionId: string;
  familyId: string;
}

export function signAccessJWT(payload: JWTPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as StringValue,
  });
}

export function signRefreshJWT(payload: RefreshJWTPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as any, {
    expiresIn: env.JWT_REFRESH_EXPIRES as StringValue,
  });
}

export function verifyAccessJWT(token: string) {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshJWT(token: string) {
  try {
    const decoded = jwt.verify(
      token,
      env.JWT_REFRESH_SECRET,
    ) as RefreshJWTPayload;
    return decoded;
  } catch {
    return null;
  }
}
