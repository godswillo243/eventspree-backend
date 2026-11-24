import type { Response } from "express";
import type { ApiResponse } from "../types";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string,
  statusCode = 200,
  meta?: Record<string, unknown>,
) {
  res
    .status(statusCode)
    .json({ success: true, data, message, ...(meta ? { meta } : {}) });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  details?: unknown,
) {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}
