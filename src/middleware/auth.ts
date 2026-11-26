import type { Handler } from "express";
import type { UserRole } from "../db/types";
import { sendError } from "../utils/api-response";
import { verifyAccessJWT } from "../utils/jwt";

export const requireAuth: Handler = (req, res, next) => {
  const token =
    req.cookies.accessToken ?? req.headers.authorization?.split(" ")?.[1];

  if (!token) {
    sendError(res, "Missing access token.", 401);
    return;
  }

  const payload = verifyAccessJWT(token);

  if (!payload) {
    sendError(res, "Invalid access token.", 401);
    return;
  }

  req.user = {
    id: payload.userId,
    role: payload.role,
  };

  next();
};

export function requireRole(role: UserRole): Handler {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      sendError(res, "You are not authorized to access this route.", 403);
      return;
    }
    next();
  };
}
