import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Font,
  Tailwind,
  Preview,
} from "@react-email/components";
import { emailTailwindConfig } from "../config/tailwind-config";

interface EmailLayoutProps {
  previewText: string;
  children: React.ReactNode;
}

export function EmailLayout({ previewText, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Figtree"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://yourcdn.com/fonts/figtree.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Tailwind config={emailTailwindConfig}>
        <Body className="bg-neutral-50 font-sans py-10">
          <Container className="bg-neutral-0 rounded-lg mx-auto max-w-[480px] overflow-hidden shadow-sm">
            {/* Header */}
            <Section className="bg-primary-600 px-8 py-6 text-center">
              <Text className="text-neutral-0 text-[20px] font-bold m-0">
                Eventspree
              </Text>
            </Section>

            {/* Body content */}
            <Section className="px-8 py-10">{children}</Section>

            <Hr className="border-neutral-200 mx-8" />

            {/* Footer */}
            <Section className="px-8 py-6">
              <Text className="text-neutral-400 text-[12px] text-center m-0">
                Eventspree · Port Harcourt, Nigeria
              </Text>
              <Text className="text-neutral-400 text-[12px] text-center mt-1">
                Questions? Reach us at{" "}
                <a
                  href="mailto:hello@eventspree.ng"
                  className="text-primary-600 underline"
                >
                  hello@eventspree.ng
                </a>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
