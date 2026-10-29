import { UserRole } from "../db/types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
      };

      requestId: string;
      log: Logger;
    }
  }
}

export {};
