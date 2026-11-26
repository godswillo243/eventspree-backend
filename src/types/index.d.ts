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

export type PublicUser = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: "user" | "admin" | "moderator" | "support";
  status: "active" | "suspended" | "inactive";
};

export {};
