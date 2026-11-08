import { createRouter } from "@tanstack/react-router";
import { queryClient } from "@/lib/query-client";
import { ErrorPage } from "@/pages/error";
// Generated from src/routes/ by the router plugin (dev / build) or `tsr generate`; don't edit it
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPendingMs: 200,
  // A page that throws (or `requireAccess` saying no): the 403 page, or "failed to load" with a retry
  defaultErrorComponent: ErrorPage,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
