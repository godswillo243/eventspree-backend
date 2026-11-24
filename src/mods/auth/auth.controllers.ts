import { type Handler, type Request, type Response } from "express";

import * as services from "./auth.services";
import { DAY } from "../../constants";
import { env } from "../../config/env";
import { sendError, sendSuccess } from "../../utils/api-response";
import { ApiError } from "../../utils/api-error";

export const signup: Handler = async (req: Request, res: Response) => {
  const { data, message, statusCode, meta } = await services.signup(req.body);
  sendSuccess(res, data, message, statusCode);
};
export const signin: Handler = async (req: Request, res: Response) => {
  const { data, message, statusCode, meta } = await services.signin(req.body);

  res.cookie("refreshToken", meta?.refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: DAY * 30,
    secure: env.NODE_ENV === "production",
  });
  sendSuccess(res, data, message, statusCode);
};
export const signinWithGoogle: Handler = async (
  req: Request,
  res: Response,
) => {
  const { data, message, statusCode, meta } = await services.signinWithGoogle({
    code: req.query.code as string,
  });

  res.cookie("refreshToken", meta?.refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: DAY * 30,
    secure: env.NODE_ENV === "production",
  });
  res.redirect(
    `${env.CLIENT_URL}/google/callback?accessToken=${data.accessToken}`,
  );
  // sendSuccess(res, data, message, statusCode);
};

export const verifyEmail: Handler = async (req: Request, res: Response) => {
  const { data, message, statusCode } = await services.verifyEmail(req.body);
  sendSuccess(res, data, message, statusCode);
};

export const resendEmailVerification: Handler = async (
  req: Request,
  res: Response,
) => {
  const { data, message, statusCode } =
    await services.resendEmailVerificationOTP(req.body);

  sendSuccess(res, data, message, statusCode);
};

export const forgotPassword: Handler = async (req: Request, res: Response) => {
  const { data, message, statusCode } = await services.forgotPassword(req.body);

  sendSuccess(res, data, message, statusCode);
};

export const resetPassword: Handler = async (req: Request, res: Response) => {
  const { data, message, statusCode } = await services.resetPassword(req.body);

  sendSuccess(res, data, message, statusCode);
};

export const refresh: Handler = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  const { data, message, statusCode, meta } = await services.refresh(token);

  res.cookie("refreshToken", meta?.refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: DAY * 30,
    secure: env.NODE_ENV === "production",
  });

  sendSuccess(res, data, message, statusCode);
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  const { data, message, statusCode } = await services.logout(token);

  res.clearCookie("refreshToken");

  sendSuccess(res, data, message, statusCode);
};

export const getAuthUser = async (req: Request, res: Response) => {
  if (!req.user)
    throw new ApiError(401, "You are not authenticated. Sign in to continue");

  const { data, message, statusCode } = await services.getAuthUser(req.user.id);
  sendSuccess(res, data, message, statusCode);
};
