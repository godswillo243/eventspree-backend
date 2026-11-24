import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import dotenv from "dotenv";
import { env } from "../config/env";

dotenv.config();

const connectionString = env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// For query purposes
export const queryClient = postgres(connectionString, {});
export const db = drizzle(queryClient, { schema });

export type Database = typeof db;
