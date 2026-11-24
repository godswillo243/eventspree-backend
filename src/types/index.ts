export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export {};
