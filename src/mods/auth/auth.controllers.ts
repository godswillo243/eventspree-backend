import { type Handler, type Request, type Response } from "express";
import {
  forgotPasswordService,
  getAuthUserService,
  logoutService,
  refreshService,
  resendEmailVerificationOTP,
  resetPasswordService,
  signinService,
  signupService,
  verifyEmailService,
} from "./auth.services";
import { getErrorResponse, getSuccessResponse } from "../../lib/utils";
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
          ? getSuccessResponse(result.data, result.message)
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
          ? getSuccessResponse(result.data, result.message)
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
          ? getSuccessResponse(result.data, result.message)
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
          ? getSuccessResponse({ email: req.body.email }, result.message)
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
          ? getSuccessResponse(null, result.message)
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
          ? getSuccessResponse({ email: req.body.email }, result.message)
          : getErrorResponse(result.message),
      );
  },
);
export const refresh: Handler = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;
    const result = await refreshService(token);

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
          ? getSuccessResponse(result.data, result.message)
          : getErrorResponse(result.message),
      );
  },
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  const result = await logoutService(token);

  res.clearCookie("refreshToken");

  res
    .status(result.statusCode)
    .json(
      result.ok
        ? getSuccessResponse(result.data, result.message)
        : getErrorResponse(result.message),
    );
});
export const getAuthUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user)
    return res.status(401).json({
      message: "You are not authenticated. Sign in to continue.",
    });
  const result = await getAuthUserService(req.user.id);
  res
    .status(result.statusCode)
    .json(
      result.ok
        ? getSuccessResponse(result.data, result.message)
        : getErrorResponse(result.message),
    );
});
