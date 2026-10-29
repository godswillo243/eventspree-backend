// packages/transactional/emails/resend-verification.tsx

import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import { OtpCode } from "./components/otp-code";

interface ResendVerificationProps {
  firstName: string;
  otpCode: string;
}

export default function ResendVerificationEmail({
  firstName,
  otpCode,
}: ResendVerificationProps) {
  return (
    <EmailLayout
      previewText={`Your new Eventspree verification code: ${otpCode}`}
    >
      <Heading className="text-[22px] font-bold text-neutral-900 m-0 mb-4">
        Here's your new code
      </Heading>

      <Text className="text-[14px] text-neutral-600 leading-[20px] m-0">
        Hi {firstName}, as requested, here's a new verification code to confirm
        your email address.
      </Text>

      <OtpCode code={otpCode} />

      <Text className="text-[13px] text-neutral-400 leading-[18px] m-0">
        This code expires in 10 minutes. If you didn't request this, please
        ignore this email or contact support if you're concerned about your
        account's security.
      </Text>
    </EmailLayout>
  );
}
