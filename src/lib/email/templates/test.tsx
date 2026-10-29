import { Heading, Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";

export default function TestEmail() {
  return (
    <EmailLayout previewText="Your Eventspree password has been changed">
      <Section className="text-center mb-4">
        <Text className="text-[40px] m-0">Testing</Text>
      </Section>

      <Heading className="text-[22px] font-bold text-neutral-900 m-0 mb-4 text-center">
        Testing email service
      </Heading>

      <Text className="text-[14px] text-neutral-600 leading-[20px] m-0 mb-6 text-center">
        Hello there is a test email
      </Text>
    </EmailLayout>
  );
}
