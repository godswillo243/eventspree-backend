import { type Handler, type Request, type Response } from "express";
import {
  forgotPasswordService,
  resendEmailVerificationOTP,
  resetPasswordService,
  signinService,
  signupService,
  verifyEmailService,
} from "./auth.services";
import { getErrorResponse, getSuccesResponse } from "../../lib/utils";
import { asyncHandler } from "../../lib/async-handler";
import { DAY } from "../../constants";
import { env } from "../../config/env";

export const signup: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await signupService(req.body);
    res
      .status(result.statusCode)
      .json(
        result.ok
          ? getSuccesResponse(result.data, result.message)
          : getErrorResponse(result.message),
      );
  },
);
export const signin: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await signinService(req.body);

    if (result.ok)
      res.cookie("refreshToken", result.meta?.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: DAY * 30,
        secure: env.NODE_ENV === "production",
      });

    res
      .status(result.statusCode)
      .json(
        result.ok
          ? getSuccesResponse(result.data, result.message)
          : getErrorResponse(result.message),
      );
  },
);
export const verifyEmail: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await verifyEmailService(req.body);
    res
      .status(result.statusCode)
      .json(
        result.ok
          ? getSuccesResponse(result.data, result.message)
          : getErrorResponse(result.message),
      );
  },
);

export const resendEmailVerification: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await resendEmailVerificationOTP(req.body);

    res
      .status(result.statusCode)
      .json(
        result.ok
          ? getSuccesResponse({ email: req.body.email }, result.message)
          : getErrorResponse(result.message),
      );
  },
);

export const forgotPassword: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await forgotPasswordService(req.body);

    res
      .status(result.statusCode)
      .json(
        result.ok
          ? getSuccesResponse(null, result.message)
          : getErrorResponse(result.message),
      );
  },
);

export const resetPassword: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await resetPasswordService(req.body);

    res
      .status(result.statusCode)
      .json(
        result.ok
          ? getSuccesResponse({ email: req.body.email }, result.message)
          : getErrorResponse(result.message),
      );
  },
);
export function refresh(req: Request, res: Response) {}
export function logout(req: Request, res: Response) {}
export function getAuthUser(req: Request, res: Response) {}
