import { createFileRoute, redirect } from "@tanstack/react-router";
import { settings } from "@/settings";

export const Route = createFileRoute("/")({
  beforeLoad() {
    throw redirect({ to: settings.homePath });
  },
});
