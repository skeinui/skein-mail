<p align="center"><img src="brand/skein-logo.svg" alt="Skein UI" width="72" height="72" /></p>

# Skein Mail

**English** | [简体中文](README.zh-CN.md)

Email client UI example for [Skein UI](https://github.com/skeinui/skein), with mock data and no backend.

It is the `admin` template of `skein create`, with a mailbox on top: every screen is built from existing
`@skeinui/ui` components, and every request is answered in the browser by [MSW](https://mswjs.io).

## What it shows

- **Mailboxes in the menu**: Inbox, Drafts, Sent, Archive, Junk and Trash, each its own page and tab (search,
  filter and the open message are kept per mailbox).
- **List and reader**: unread and starred rows, attachments, a search box, All / Unread / Starred filters,
  paging. Opening a message marks it read; star, mark as unread, archive, move back to the Inbox and delete
  show at once.
- **Compose drawer**: To, Cc, subject, text, attachments; send, or save as a draft. A draft opens again with
  Edit and the result replaces it. Reply quotes the message.
- **Deleting**: from any mailbox it moves to Trash; from Trash it asks first, then it is gone.
- **Skein UI's own parts**: four theme styles (HeroUI, Ant Design, shadcn/ui, Skein) with light and dark mode,
  Chinese and English, tabs, keep-alive pages and the preferences drawer, all from the admin shell.

## Run it

```bash
pnpm install
pnpm dev
```

Sign in with `admin` / `admin123`; the app opens on the Inbox.

> The `@skeinui/*` packages are linked from a local checkout of Skein (`file:` paths in `package.json` and
> `pnpm-workspace.yaml`, `"local": true` in `.skein.json`), because the versions this app uses are not on npm
> yet. Until then, install it on a machine where that checkout is at the path written there; afterwards,
> replace them with the published version (`^<version>`).

```bash
pnpm check   # skein check (types, i18n, hard-coded colors, theme coverage) and vp check
pnpm build
```

## How it is put together

```
src/pages/mail/            the mailbox: one page, used by six routes
  api/                     types and requests (the API's shape, in the style of JMAP)
  mocks/                   240 seeded messages and the MSW handlers for the API
  components/              the list, the reader and the compose drawer
  locales/                 zh / en messages
src/pages/<mailbox>/       inbox, drafts, sent, archive, junk, trash: a `_meta.ts` each (the menu entry)
src/routes/_auth/<mailbox>.tsx   a route each, rendering `<MailPage box="…" />`
src/lib/list-query/        the list contract: page, sort, keyword and a filter of conditions and groups
```

- **The menu comes from the page directories**: a directory with a `_meta.ts` (icon, `{ zh, en }` label,
  order) is a menu entry, so the six mailboxes need no registration.
- **The list asks with a `ListQuery`**: the mailbox, unread and starred are conditions of one standard
  filter, the search box is its keyword (`POST /api/mail/emails/search`). The mock runs the query over its
  messages with `applyListQuery`; another backend takes it through a `QueryAdapter`.
- **API**, as the mock answers it:

  | Request                        | What it does                               |
  | ------------------------------ | ------------------------------------------ |
  | `GET /api/mail/mailboxes`      | the mailboxes with their total and unread  |
  | `POST /api/mail/emails/search` | a page of messages for a `ListQuery`       |
  | `GET /api/mail/emails/:id`     | one message: people, text, attachments     |
  | `PATCH /api/mail/emails/:id`   | read state, star, move to another mailbox  |
  | `DELETE /api/mail/emails/:id`  | to Trash; from Trash, for good             |
  | `POST /api/mail/emails`        | send, or save a draft (`replaces` a draft) |

## Not in it

This is an example of the interface, not a mail server: there is no sending or receiving, nothing is kept
between reloads, attachments are names and sizes only, and message text is plain text / Markdown (real HTML
mail would need sanitizing, which the component library doesn't do).

## Learn more

- [Skein UI](https://github.com/skeinui/skein): the components, the theme styles and the CLI that made this
  project.
- `AGENTS.md`: the rules for working in this project (also read by coding agents).
