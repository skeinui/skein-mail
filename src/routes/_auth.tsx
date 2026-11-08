import { createFileRoute, redirect } from "@tanstack/react-router";
import { RouteLayout } from "@/modules";
import { NotFoundPage } from "@/pages/not-found";
import { useAuthStore } from "@/store/auth-store";

/** Every route under routes/_auth/ needs a session; without one, go to the login page and come back after. */
export const Route = createFileRoute("/_auth")({
  beforeLoad({ location }) {
    const { token, setIntendedPath } = useAuthStore.getState();
    if (!token) {
      setIntendedPath(location.href);
      throw redirect({ to: "/login" });
    }
  },
  component: RouteLayout,
  notFoundComponent: NotFoundPage,
});
