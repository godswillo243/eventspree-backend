// packages/transactional/emails/email-verified.tsx

import { Heading, Text, Section } from "react-email";
import { EmailLayout } from "./layout";
import { EmailButton } from "./components/email-button";

interface EmailVerifiedProps {
  firstName: string;
  dashboardUrl: string;
}

export default function EmailVerifiedEmail({
  firstName = "Chidi",
  dashboardUrl = "https://eventspree.ng/dashboard",
}: EmailVerifiedProps) {
  return (
    <EmailLayout previewText="Your email has been verified — welcome to Eventspree!">
      <Section className="text-center mb-4">
        <Text className="text-[40px] m-0">✅</Text>
      </Section>

      <Heading className="text-[22px] font-bold text-neutral-900 m-0 mb-4 text-center">
        You're all set, {firstName}!
      </Heading>

      <Text className="text-[14px] text-neutral-600 leading-[20px] m-0 mb-6 text-center">
        Your email has been successfully verified. You can now start exploring
        Eventspree — discover vendors, book venues, and plan your next event
        with confidence.
      </Text>

      <Section className="text-center">
        <EmailButton href={dashboardUrl}>Go to Dashboard</EmailButton>
      </Section>
    </EmailLayout>
  );
}
