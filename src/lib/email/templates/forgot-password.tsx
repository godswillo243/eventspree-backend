// packages/transactional/emails/forgot-password.tsx

import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";
import { OtpCode } from "./components/otp-code";

interface ForgotPasswordProps {
  firstName: string;
  otpCode: string;
}

export default function ForgotPasswordEmail({
  firstName,
  otpCode,
}: ForgotPasswordProps) {
  return (
    <EmailLayout previewText="Reset your Eventspree password">
      <Heading className="text-[22px] font-bold text-neutral-900 m-0 mb-4">
        Reset your password
      </Heading>

      <Text className="text-[14px] text-neutral-600 leading-[20px] m-0 mb-6">
        Hi {firstName}, we received a request to reset your Eventspree password.
        Click the button below to choose a new one.
      </Text>

      <Section className="text-center mb-6">
        <OtpCode code={otpCode} />
      </Section>

      <Text className="text-[13px] text-neutral-400 leading-[18px] m-0">
        This code expires in 30 minutes. If you didn't request a password reset,
        you can safely ignore this email — your password will remain unchanged.
      </Text>
    </EmailLayout>
  );
}
