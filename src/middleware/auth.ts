import type { Handler } from "express";
import type { UserRole } from "../db/types";
import { getErrorResponse } from "../lib/utils";
import { verifyAccessJWT } from "../lib/jwt";

export const requireAuth: Handler = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")?.[1];

  if (!token) {
    return res.status(401).json(getErrorResponse("Missing access token."));
  }

  const payload = verifyAccessJWT(token);

  if (!payload) {
    return res.status(401).json(getErrorResponse("Invalid access token."));
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
      return res
        .status(403)
        .json(
          getErrorResponse(
            "You are not authorized to access this route.",
            "UNAUTHORIZED",
          ),
        );
    }
    next();
  };
}
