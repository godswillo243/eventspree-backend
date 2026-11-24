import { Router } from "express";
import { rateLimiter } from "../../utils/rate-limit";
import { HOUR, MINUTE } from "../../constants";
import {
  forgotPassword,
  getAuthUser,
  logout,
  refresh,
  resendEmailVerification,
  resetPassword,
  signin,
  signinWithGoogle,
  signup,
  verifyEmail,
} from "./auth.controllers";
import { ipKeyGenerator } from "express-rate-limit";
import { validate } from "../../middleware/validate";
import {
  forgotPasswordSchema,
  resendEmailVerificationOTPSchema,
  resetPasswordSchema,
  signinSchema,
  signupSchema,
  verifyEmailSchema,
} from "./auth.schemas";
import { requireAuth } from "../../middleware/auth";

const routes: Router = Router();

routes.post(
  "/signup",
  rateLimiter(HOUR * 1, 5),
  validate(signupSchema, "body"),
  signup,
);
routes.post(
  "/signin",
  rateLimiter(MINUTE * 15, 10, {
    keyGenerator: (req) => {
      const key = req.ip + req.body.email;
      return ipKeyGenerator(key);
    },
  }),
  validate(signinSchema, "body"),
  signin,
);

routes.post(
  "/verify-email",
  rateLimiter(MINUTE * 15, 10, {
    keyGenerator: (req) => {
      return ipKeyGenerator(req.ip + req.body.email);
    },
  }),
  validate(verifyEmailSchema, "body"),
  verifyEmail,
);

routes.post(
  "/verify-email/resend",
  rateLimiter(HOUR, 3, {
    keyGenerator: (req) => ipKeyGenerator(req.ip + req.body.email),
  }),
  validate(resendEmailVerificationOTPSchema, "body"),
  resendEmailVerification,
);

routes.post(
  "/password/forgot",
  rateLimiter(HOUR, 3, {
    keyGenerator: (req) => ipKeyGenerator(req.ip + req.body.email),
  }),
  validate(forgotPasswordSchema, "body"),
  forgotPassword,
);

routes.post(
  "/password/reset",
  rateLimiter(MINUTE * 15, 10, {
    keyGenerator: (req) => ipKeyGenerator(req.ip + req.body.email),
  }),
  validate(resetPasswordSchema, "body"),
  resetPassword,
);

routes.post("/refresh", rateLimiter(MINUTE * 15, 30), refresh);

routes.post("/logout", logout);

routes.get("/google/callback", signinWithGoogle);

routes.get("/user", requireAuth, getAuthUser);

export default routes;
