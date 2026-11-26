import { type Handler, type Request, type Response } from "express";

import * as services from "./auth.services";
import { sendSuccess } from "../../utils/api-response";
import { ApiError } from "../../utils/api-error";
import type { User } from "../../db/types";
import { clearAuthCookies, setAuthCookies } from "./auth.utils";
import type { PublicUser } from "../../types";

export const signup: Handler = async (req: Request, res: Response) => {
  const { data, message, statusCode } = await services.signup(req.body);

  sendSuccess(res, data, message, statusCode);
};
export const signin: Handler = async (req: Request, res: Response) => {
  const { data, message, statusCode, meta } = await services.signin(req.body);

  setAuthCookies(
    res,
    (data as { accessToken: string }).accessToken,
    meta?.refreshToken as string,
  );
  sendSuccess(
    res,
    { user: (data as { user: User }).user },
    message,
    statusCode,
  );
};
export const signinWithGoogle: Handler = async (req, res) => {
  const { data, message, statusCode, meta } = await services.signinWithGoogle(
    req.body,
  );
  setAuthCookies(res, data.accessToken, meta?.refreshToken);
  sendSuccess(res, { user: data.user }, message, statusCode);
};

export const verifyEmail: Handler = async (req, res) => {
  const { data, message, statusCode, meta } = await services.verifyEmail(
    req.body,
  );
  setAuthCookies(
    res,
    (data as { accessToken: string }).accessToken,
    meta?.refreshToken as string,
  );
  sendSuccess(
    res,
    { user: (data as { user: PublicUser }).user },
    message,
    statusCode,
  );
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

  setAuthCookies(
    res,
    (data as { accessToken: string }).accessToken,
    meta?.refreshToken as string,
  );

  sendSuccess(res, null, message, statusCode);
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  const { data, message, statusCode } = await services.logout(token);

  clearAuthCookies(res);

  sendSuccess(res, data, message, statusCode);
};

export const getAuthUser = async (req: Request, res: Response) => {
  if (!req.user)
    throw new ApiError(401, "You are not authenticated. Sign in to continue");

  const { data, message, statusCode } = await services.getAuthUser(req.user.id);
  sendSuccess(res, data, message, statusCode);
};
