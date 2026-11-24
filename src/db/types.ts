import type { userRoleEnum, users, otpTypeEnum, otpRecords } from "./schema";

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export type OTPType = (typeof otpTypeEnum.enumValues)[number];

export type OTPRecord = typeof otpRecords.$inferSelect;
