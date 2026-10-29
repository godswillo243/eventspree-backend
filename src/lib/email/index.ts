import { env } from "../../config/env";
import { Resend } from "resend";
import { render } from "react-email";
import { EmailLayout } from "./templates/layout";
import TestEmail from "./templates/test";
import SignUpOtpEmail from "./templates/signup";
import EmailVerifiedEmail from "./templates/email-verified";
import ForgotPasswordEmail from "./templates/forgot-password";
import ResendVerificationEmail from "./templates/resend-verification";
import PasswordResetSuccessEmail from "./templates/password-reset-success";

const resend = new Resend(env.RESEND_API_KEY);

type SendMailProps = {
  to: string[];
  subject: string;
  html: string;
};

const EMAIL_FROM = "Eventspree <hello@eventspree.ng>";

export async function sendEmail(props: SendMailProps) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    ...props,
  });

  return { data, error };
}

export async function sendTestEmail(to: string[]) {
  const html = await render(TestEmail());

  return await sendEmail({
    html,
    subject: "Test",
    to,
  });
}

export async function sendSignUpOtp(
  to: string,
  firstName: string,
  otpCode: string,
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Verify your email — Eventspree",
    react: SignUpOtpEmail({ firstName, otpCode }),
  });
}

export async function sendEmailVerified(
  to: string,
  firstName: string,
  dashboardUrl: string,
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "You're verified! Welcome to Eventspree",
    react: EmailVerifiedEmail({ firstName, dashboardUrl }),
  });
}

export async function sendForgotPassword(
  to: string,
  firstName: string,
  otpCode: string,
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Reset your Eventspree password",
    react: ForgotPasswordEmail({ firstName, otpCode }),
  });
}

export async function sendResendVerificationOTP(
  to: string,
  firstName: string,
  otpCode: string,
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Verify your Email - Eventspree",
    react: ResendVerificationEmail({ firstName, otpCode }),
  });
}

export async function sendPasswordResetSuccess(
  to: string,
  firstName: string,
  loginUrl: string,
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Password reset successful - Eventspree",
    react: PasswordResetSuccessEmail({ firstName, loginUrl }),
  });
}
