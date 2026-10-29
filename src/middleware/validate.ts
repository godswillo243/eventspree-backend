import type { Handler } from "express";
import type { ZodType } from "zod";
import { getErrorResponse } from "../lib/utils";

export function validate(
  schema: ZodType,
  type: "body" | "query" | "params",
): Handler {
  return (req, res, next) => {
    const result = schema.safeParse(
      type === "body" ? req.body : type === "params" ? req.params : req.query,
    );

    if (!result.success) {
      const errors: Array<{ field: string; message: string }> = [];

      for (const issue of result.error.issues) {
        errors.push({
          field: issue.path.join("."),
          message: issue.message,
        });
      }

      res
        .status(400)
        .json(
          getErrorResponse(
            "Validation failed: " +
              result.error.issues.map((iss) => iss.message).join(". "),
            "VALIDATION_ERROR",
            errors,
          ),
        );
      return;
    }

    next();
  };
}
