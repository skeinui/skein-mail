import { createFileRoute } from "@tanstack/react-router";
import { MailPage } from "@/pages/mail";

export const Route = createFileRoute("/_auth/archive")({
  component: () => <MailPage box="archive" />,
});
