// packages/transactional/emails/password-reset-success.tsx

import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";
import { EmailButton } from "./components/email-button";

interface PasswordResetSuccessProps {
  firstName: string;
  loginUrl: string;
}

export default function PasswordResetSuccessEmail({
  firstName,
  loginUrl,
}: PasswordResetSuccessProps) {
  return (
    <EmailLayout previewText="Your Eventspree password has been changed">
      <Section className="text-center mb-4">
        <Text className="text-[40px] m-0">🔒</Text>
      </Section>

      <Heading className="text-[22px] font-bold text-neutral-900 m-0 mb-4 text-center">
        Password changed successfully
      </Heading>

      <Text className="text-[14px] text-neutral-600 leading-[20px] m-0 mb-6 text-center">
        Hi {firstName}, your Eventspree password was just changed. If this was
        you, no further action is needed.
      </Text>

      <Section className="text-center mb-6">
        <EmailButton href={loginUrl}>Log In</EmailButton>
      </Section>

      <Text className="text-[13px] text-danger-700 bg-danger-50 rounded-md px-4 py-3 leading-[18px] m-0">
        If you didn't make this change, please contact us immediately at{" "}
        <a href="mailto:hello@eventspree.ng" className="underline">
          hello@eventspree.ng
        </a>{" "}
        to secure your account.
      </Text>
    </EmailLayout>
  );
}
