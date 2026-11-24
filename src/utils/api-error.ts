export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, string[]>,
    public redirectUrl?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
