import { pgEnum } from "drizzle-orm/pg-core";

export const targetTypeEnum = pgEnum("target_type", ["vendor", "venue"]);
