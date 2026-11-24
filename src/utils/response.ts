import type { Response } from "express";

function sendSuccess<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

function sendError(
  res: Response,
  message: string,
  code = "INTERNAL_ERROR",
  status = 500,
  details?: unknown,
) {
  return res.status(status).json({
    success: false,
    error: { message, code, ...(details ? { details } : {}) },
  });
}
