// packages/transactional/emails/sign-up-otp.tsx

import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./layout";
import { OtpCode } from "./components/otp-code";

interface SignUpOtpEmailProps {
  firstName: string;
  otpCode: string;
}

export default function SignUpOtpEmail({
  firstName,
  otpCode,
}: SignUpOtpEmailProps) {
  return (
    <EmailLayout previewText={`Your Eventspree verification code: ${otpCode}`}>
      <Heading className="text-[22px] font-bold text-neutral-900 m-0 mb-4">
        Verify your email
      </Heading>

      <Text className="text-[14px] text-neutral-600 leading-[20px] m-0">
        Hi {firstName}, welcome to Eventspree! Use the code below to verify your
        email address and complete your sign up.
      </Text>

      <OtpCode code={otpCode} />

      <Text className="text-[13px] text-neutral-400 leading-[18px] m-0">
        This code expires in 10 minutes. If you didn't request this, you can
        safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
