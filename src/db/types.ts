import type { userRole, users, otpTypeEnum } from "./schema";

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type UserRole = (typeof userRole.enumValues)[number];

export type OTPType = (typeof otpTypeEnum.enumValues)[number];
