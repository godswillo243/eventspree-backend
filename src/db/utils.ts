import { db } from "./client";
import { sql } from "drizzle-orm";

export const dbCheck = async () => {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: "success" as const };
  } catch (err) {
    console.log("Database health check failed: ", err);
    return {
      status: "failed" as const,
    };
  }
};
