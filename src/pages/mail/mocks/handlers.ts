import { http, HttpResponse, delay } from "msw";
import { applyListQuery } from "@/lib/list-query";
import type { ListQuery } from "@/lib/list-query";
import type { EmailInput, EmailPatch, EmailSummary } from "../api";
import { ME, emails, mailboxId, mailboxes, nextEmailId } from "./mail-data";

const notFound = () => HttpResponse.json({ message: "Message not found" }, { status: 404 });

/** The list shows the summary; the body and the people are fetched when a message is opened. */
const summary = (email: (typeof emails)[number]): EmailSummary => ({
  id: email.id,
  mailboxId: email.mailboxId,
  fromName: email.fromName,
  fromEmail: email.fromEmail,
  toName: email.to[0]?.name ?? "",
  subject: email.subject,
  preview: email.preview,
  receivedAt: email.receivedAt,
  seen: email.seen,
  flagged: email.flagged,
  hasAttachment: email.hasAttachment,
});

const address = (value: string) => {
  const match = /^(.*?)\s*<(.+)>$/.exec(value.trim());
  return match
    ? { name: match[1] || match[2]!, email: match[2]! }
    : { name: value.trim(), email: value.trim() };
};

export const handlers = [
  http.get("*/api/mail/mailboxes", async () => {
    await delay(150);
    return HttpResponse.json({ data: mailboxes() });
  }),
  // `Email/query`: mailbox, unread and starred are conditions of the standard filter
  http.post("*/api/mail/emails/search", async ({ request }) => {
    await delay(250);
    const query = (await request.json()) as ListQuery;
    const sorted = {
      ...query,
      sort: query.sort ?? [{ field: "receivedAt", order: "desc" as const }],
    };
    const result = applyListQuery(emails.map(summary), sorted, {
      keywordFields: ["subject", "fromName", "fromEmail", "preview"],
    });
    return HttpResponse.json({ data: result });
  }),
  http.get("*/api/mail/emails/:id", async ({ params }) => {
    await delay(150);
    const email = emails.find((e) => e.id === params.id);
    return email ? HttpResponse.json({ data: email }) : notFound();
  }),
  // `Email/set`: read state, star, move
  http.patch("*/api/mail/emails/:id", async ({ params, request }) => {
    const email = emails.find((e) => e.id === params.id);
    if (!email) return notFound();
    Object.assign(email, (await request.json()) as EmailPatch);
    return HttpResponse.json({ data: email });
  }),
  // Delete moves to Trash; a message already there is gone for good
  http.delete("*/api/mail/emails/:id", ({ params }) => {
    const index = emails.findIndex((e) => e.id === params.id);
    if (index < 0) return notFound();
    const email = emails[index]!;
    if (email.mailboxId === mailboxId("trash")) emails.splice(index, 1);
    else email.mailboxId = mailboxId("trash");
    return HttpResponse.json({ data: null });
  }),
  http.post("*/api/mail/emails", async ({ request }) => {
    await delay(400);
    const input = (await request.json()) as EmailInput;
    const old = emails.findIndex((e) => e.id === input.replaces);
    if (old >= 0) emails.splice(old, 1);
    const email = {
      id: nextEmailId(),
      mailboxId: mailboxId(input.draft ? "drafts" : "sent"),
      fromName: ME.name,
      fromEmail: ME.email,
      toName: input.to[0] ? address(input.to[0]).name : "",
      subject: input.subject,
      preview: input.body.slice(0, 120),
      receivedAt: new Date().toISOString(),
      seen: true,
      flagged: false,
      hasAttachment: input.attachments.length > 0,
      to: input.to.map(address),
      cc: input.cc.map(address),
      body: input.body,
      attachments: input.attachments.map((a, i) => ({ id: `a-new-${i}`, ...a })),
    };
    emails.unshift(email);
    return HttpResponse.json({ data: email }, { status: 201 });
  }),
];
