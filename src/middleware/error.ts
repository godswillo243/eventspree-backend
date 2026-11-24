import type { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/api-response";
import { ApiError } from "../utils/api-error";

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  req.log.error(error.message, { error });
  if (error instanceof ApiError) {
    if (error.redirectUrl) return res.redirect(error.redirectUrl);
    sendError(res, error.message, error.statusCode, error.code);
    return;
  }
  const status = 500;
  const errorCode = "INTERNAL_SERVER_ERROR";
  const message = "Internal server error.";

  sendError(res, message, status, errorCode);
}
