import type { StringValue } from "ms";

interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message: string;
  data: T | null;
  meta?: Record<string, unknown>;
  errorCode?: string;
  errors?: Array<{ field: string; message: string }>;
}

export function getSuccessResponse<T>(
  data: T,
  message: string,
  meta?: Record<string, unknown>,
): ApiResponse<T> {
  return { status: "success", data, message, meta };
}

export function getErrorResponse(
  message: string,
  errorCode?: string,
  errors?: Array<{ field: string; message: string }>,
): ApiResponse<never> {
  return {
    data: null,
    message,
    status: "error",
    errorCode,
    errors,
  };
}

export function changeStringValueToDate(input: StringValue) {
  let unit: "d" | "h" | "m" | "s" | "ms" | null = null;
}
