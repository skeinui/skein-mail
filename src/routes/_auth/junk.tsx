import { createFileRoute } from "@tanstack/react-router";
import { MailPage } from "@/pages/mail";

export const Route = createFileRoute("/_auth/junk")({
  component: () => <MailPage box="junk" />,
});
