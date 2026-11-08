# Skein Mail

A React app built with [Skein UI](https://github.com/skeinui/skein): an admin app (layout, menu, tabs, login). Read this before changing code.

## Commands

- `npm run dev`: start the app (the API is mocked by MSW, see `.env.development`); sign in with admin / admin123.
- `npm run check`: **run after every change.** First `skein check` (type errors, missing translations, hard-coded colors and theme coverage, each with a hint on the Skein way to fix it), then `vp check` (format, lint, types). `npx vp check --fix` formats and fixes what it can. Repeat until it reports no errors. `npm run build` must pass too.
- `npx skein docs <Component>`: props (with the allowed values), parts and examples of a Skein component. `npx skein docs --search <words>` finds one. Look a component up instead of guessing its props.
- `npx skein new page <path>`: add a page, e.g. `orders` or `system/roles`. It writes the route, the menu entry, the translations, the API file and a mock. Don't create page files by hand.
- `npx skein new page <path> --from <openapi.yaml> [--resource /orders]`: when there is an API description, a complete list / search / sort / create / edit / delete page (a keyword box when the API has a `q` / `keyword` / `search` parameter, the other parameters as conditions in the search bar, which offers only what the API takes; refresh, columns and CSV in the table's tools) with typed requests and mocks, from one resource of an OpenAPI 3 document, with rows to tick (export them as CSV, delete them together), sortable headers when the list has `sortBy` + `order` (or `sort=-name`) parameters, each action behind its `<resource>:create|update|delete|read` permission (`orders:create`…), plus a detail page (`/orders/42`) when the document reads one item (`GET /orders/{id}`). Prefer it to writing a CRUD page by hand.
- `npx skein new module <name>`: a part that isn't a page, in `src/modules/<name>/`.
- `npx skein theme use <default|shadcn|heroui|antd>`: the default theme style. `npx skein theme add antd heroui skein` lets users switch between several in the preferences drawer (`themeStyles` in `src/settings.ts`; each is loaded only when picked), `theme remove` takes one out.

Every `skein` command takes `--json` for machine-readable output and `--dry-run` to only list what it would write.

The toolchain is [Vite+](https://viteplus.dev/guide/) (`vp`): `vp dev`, `vp build`, `vp check`, `vp test` (Vite, Rolldown, Vitest, Oxlint, Oxfmt), set up in `vite.config.ts`. Import its APIs from `vite-plus` (`defineConfig`) and `vite-plus/test` (`describe`, `expect`…), not from `vite` or `vitest`: lint reports those. A git hook runs `vp check --fix` on the staged files before each commit.

## Skein rules

- Components take **no `className` / `style`**: every visual comes from the theme style (`themeStyles` in `src/settings.ts`). Lay out with `Flex`, `Grid`, `Row` / `Col`, or wrap a component in your own element.
- Variants are values: `variant`, `color`, `size`, `radius`. Only the values `skein docs` lists exist.
- Controlled values use `value` / `onValueChange`; open state uses `open` / `onOpenChange`.
- Prefer data props (`options`, `items`, `fields`) over building markup: e.g. `<Form fields={[…]} />`, `<Select options={[…]} />`.
- In your own CSS, colors come from tokens: `var(--ui-fg)`, `var(--ui-c-primary)`, `var(--ui-border)`… never hex values, so they follow the theme style and dark mode.
- `ConfigProvider` (in `src/providers.tsx`) puts the theme on `<html>`; keep it at the root.

## Layout

```
src/
  main.tsx, App.tsx, providers.tsx
  routes/               TanStack Router file routes, thin: each points at a page; routes/_auth/ needs a session
  pages/<name>/         one directory per page:
    index.tsx           the page component
    _meta.ts            its menu entry: icon, { zh, en } label, order (a directory with only _meta.ts is a menu group)
    api/index.ts        request functions + query keys (TanStack Query)
    components/         parts used only by this page
    locales/            messages/zh.json + en.json, used through use<Page>Translation()
    mocks/handlers.ts   MSW handlers for this page's API (picked up automatically)
  modules/<name>/       parts that aren't pages (user menu, toolbar, preferences…), same layout as a page
  skein-shell/          AdminLayout wired to the router: menu, tabs, KeepAlive, Page frame
  settings.ts           app defaults: name, home path, theme styles (themeStyles / themeStyle), default layout, menuPermission
  lib/http.ts           fetch wrapper: http.get / post / put / delete; `{ data }` responses are unwrapped
  lib/i18n.ts           i18next, zh (default) and en
  store/auth-store.ts   the session (zustand, persisted)
```

## Adding a page

1. `npx skein new page orders`; it shows up in the menu right away.
1. Write the requests in `src/pages/orders/api/index.ts` with `http` and export query keys; use them with `useQuery` / `useMutation` in the page.
1. Mock the same endpoints in `src/pages/orders/mocks/handlers.ts` (`http.get("*/api/orders", …)` from msw).
1. Put every text in `locales/messages/zh.json` and `en.json` (same keys in both) and use `t("key")`. `new page` (and `--from`) writes the English name as a placeholder in zh.json and in `_meta.ts`'s `label.zh`: write the Chinese (`npm run check` warns about what is left).
1. Wrap the page in `<Page title description actions>` from `@/skein-shell`. For a list with filters, a table, pagination and a create / edit dialog, copy the structure of `src/pages/users/`. A detail page goes under its list's path (`/users/42`: `src/pages/users/detail.tsx`, route `users_.$id.tsx`, `_` so it isn't nested in the list's route), so the menu, the breadcrumb know which list it belongs to.
1. Set the menu label, icon (lucide-react) and order in `_meta.ts`.

A layout route under `routes/_auth/` that wraps a set of pages (e.g. `$tenant.tsx` around `$tenant.orders.tsx`) renders `<PageOutlet />` from `@/skein-shell` where its pages go, not `<Outlet />`: the shell keeps pages alive in tabs and hands each layout its own page.

Lists and search: a list page asks its API with a `ListQuery` (`@/lib/list-query`): `{ page, pageSize, sort?, keyword?, filter? }`, where `filter` is a condition `{ field, op, value }` (`op`: `eq`, `ne`, `contains`, `startsWith`, `endsWith`, `in`, `gt`, `gte`, `lt`, `lte`, `between`, `blank`, `notBlank`) or a group `{ logic: "and" | "or", items: [...] }` of them, as deep as needed. The page never builds backend parameters: a `QueryAdapter` turns the query into the request one backend takes: `standardAdapter` (`POST <path>/search` with the query as the body, what `src/pages/users/` uses), `flatAdapter()` (`?status=paid&amount.gt=100&sort=-amount`; it can't say `or` or nested groups and throws `UnsupportedQueryError` instead of dropping them) or one you write (a `toRequest` function and the `capabilities` of the backend) for an API with rules of its own. `fetchList(path, query, adapter)` sends it; `applyListQuery(rows, query, { keywordFields })` runs a query over rows, which is what a mock does. The search bar is `QueryBuilder` (`@/modules/query-builder`): conditions as chips, a popover to change one, "Filter" to add a condition (rows of conditions and groups of them in the same popover); give it `fields` (`text`, `number`, `date`, `enum`, `boolean`, each with its operators) and the `filter` in use. The table's tools on the right of the toolbar are `TableTools` (`@/modules/table-tools`): refresh, which columns to show and in which order, export the rows on screen as CSV (`downloadCsv` from `@/lib/export-csv`). Copy `src/pages/users/` for a list page.

Who may do what: the API gives the signed-in user `permissions` (`GET /api/auth/profile`, also in the sign-in response): `<resource>:<action>` codes such as `orders:create`; `*` is everything, `orders:*` every action on orders. Wrap what only some users may use in `<Access code="orders:delete">…</Access>` (`fallback` for what others see instead) or ask `const { can } = useAccess()` (`@/modules/access`, `can("orders:update")`); both only decide what is shown, the API must check the permission too. Name the codes like `src/pages/users/` does (`users:create`, `users:update`, `users:delete`). The mock's `admin` may do everything, `viewer` / `viewer123` only reads, `guest` / `guest123` has no permission at all. A page's door is `beforeLoad: () => requireAccess("orders:read")` in its route (`@/modules/access`): a user without it gets the 403 page; a page that throws gets a "failed to load" page with a retry (`defaultErrorComponent`, `src/router.ts`).

Requests and sessions: `src/lib/http.ts` sends the token and the app's language (`Accept-Language`: the API answers in it). An access token the API refuses (401) is renewed with the refresh token (`POST /api/auth/refresh` → `{ token, refreshToken? }`, mocked) and the request is sent again; when that fails the session ends: the login page says it expired and signing in comes back to the page. A failed request is an `HttpError` (`status` 0: no answer): its `message` is the API's own, else the status in words (`src/lib/errors/`), so `toast.danger(error.message)` is enough. A mock answers in the language asked for with `localized(request, { zh, en })` from `@/mocks/language`.

## When you are done

`npm run check` reports no errors and `npm run build` passes.
