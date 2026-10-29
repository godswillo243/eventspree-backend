import { defineConfig } from "drizzle-kit";
import "dotenv/config";

console.log(process.env.DATABASE_URL);

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
