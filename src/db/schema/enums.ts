import { pgEnum } from "drizzle-orm/pg-core";

export const targetTypeEnum = pgEnum("target_type", [
  "vendor_listing",
  "venue",
]);
export const priceUnitEnum = pgEnum("price_unit", [
  "fixed",
  "per_day",
  "per_hour",
  "per_guest",
]);
