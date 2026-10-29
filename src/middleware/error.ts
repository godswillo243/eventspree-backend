import type { NextFunction, Request, Response } from "express";
import { getErrorResponse } from "../lib/utils";

export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const status = 500;
  const message = "Internal server error.";

  req.log.error(error.message, { error });

  res.status(status).json(getErrorResponse(message, "INTERNAL_SERVER_ERROR"));
}
