import { ipKeyGenerator, rateLimit, type Options } from "express-rate-limit";
import { sendError } from "./api-response";

export function rateLimiter(
  windowMs: number,
  limit: number,
  options?: Partial<Options>,
) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    handler: (_req, res, _next, optionsUsed) => {
      sendError(
        res,
        `Too many requests. Try again in ${Math.ceil(optionsUsed.windowMs / 1000)}s.`,
        429,
        "RATE_LIMIT_EXCEEDED",
      );
    },

    keyGenerator: (req) => ipKeyGenerator(req.ip!),

    ...options,
  });
}
