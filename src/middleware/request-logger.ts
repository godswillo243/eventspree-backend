import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { logger, type Logger } from "../config/logger";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  req.requestId = (req.headers["x-request-id"] as string) || randomUUID();
  req.log = logger.child(req.requestId);

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    req.log.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, {
      duration_ms: Math.round(ms * 100) / 100,
      ip: req.ip,
    });
  });

  next();
}
