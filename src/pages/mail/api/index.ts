import http from "@/lib/http";
import { fetchList, standardAdapter } from "@/lib/list-query";
import type { ListQuery } from "@/lib/list-query";

/** The system mailboxes; `role` is what the app knows them by, `id` what the API does (as in JMAP). */
export const MAILBOX_ROLES = ["inbox", "drafts", "sent", "archive", "junk", "trash"] as const;
export type MailboxRole = (typeof MAILBOX_ROLES)[number];

export interface Mailbox {
  id: string;
  role: MailboxRole;
  total: number;
  unread: number;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
}

export interface Address {
  name: string;
  email: string;
}

/** A message as the list shows it. */
export interface EmailSummary {
  id: string;
  mailboxId: string;
  fromName: string;
  fromEmail: string;
  /** The first recipient: what Sent and Drafts name in the list. */
  toName: string;
  subject: string;
  preview: string;
  receivedAt: string;
  seen: boolean;
  flagged: boolean;
  hasAttachment: boolean;
}

/** A message opened: the summary and everything the list leaves out. */
export interface Email extends EmailSummary {
  to: Address[];
  cc: Address[];
  /** Markdown: the mock's mail is plain text; real HTML mail needs a sanitizer the library doesn't ship. */
  body: string;
  attachments: Attachment[];
}

export interface EmailPatch {
  seen?: boolean;
  flagged?: boolean;
  mailboxId?: string;
}

export interface EmailInput {
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  attachments: { name: string; size: number }[];
  /** Saves into Drafts instead of sending. */
  draft?: boolean;
  /** The draft this one is made from: it is gone once this is saved or sent. */
  replaces?: string;
}

export const mailKeys = {
  mailboxes: ["mail", "mailboxes"] as const,
  all: ["mail", "emails"] as const,
  list: (query: ListQuery) => ["mail", "emails", "list", query] as const,
  detail: (id: string) => ["mail", "emails", "detail", id] as const,
};

export const fetchMailboxes = () => http.get<Mailbox[]>("/api/mail/mailboxes");
/** `Email/query`: the standard list contract, the mailbox is a filter like any other. */
export const fetchEmails = (query: ListQuery) =>
  fetchList<EmailSummary>("/api/mail/emails", query, standardAdapter);
export const fetchEmail = (id: string) => http.get<Email>(`/api/mail/emails/${id}`);
export const patchEmail = (id: string, patch: EmailPatch) =>
  http.patch<Email>(`/api/mail/emails/${id}`, patch);
export const deleteEmail = (id: string) => http.delete<null>(`/api/mail/emails/${id}`);
export const sendEmail = (input: EmailInput) => http.post<Email>("/api/mail/emails", input);
