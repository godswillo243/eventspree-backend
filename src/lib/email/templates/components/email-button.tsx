import { Button } from "react-email";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <Button
      href={href}
      className="bg-primary-500 text-neutral-0 font-semibold text-[14px] px-6 py-3 rounded-md box-border"
    >
      {children}
    </Button>
  );
}
