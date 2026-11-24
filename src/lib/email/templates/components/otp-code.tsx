import { Section, Text } from "react-email";

export function OtpCode({ code }: { code: string }) {
  return (
    <Section className="bg-neutral-50 border border-neutral-200 rounded-lg py-5 text-center my-6">
      <Text className="text-[32px] font-bold tracking-[8px] text-neutral-900 m-0">
        {code}
      </Text>
    </Section>
  );
}
