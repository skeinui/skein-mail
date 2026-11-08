import { MAILBOX_ROLES } from "../api";
import type { Attachment, Email, Mailbox, MailboxRole } from "../api";

/** The signed-in account's address: what sent mail comes from, what other mail is addressed to. */
export const ME = { name: "Skein Demo", email: "demo@skein.mail" };

export const mailboxId = (role: MailboxRole) => `mb-${role}`;

// A seeded generator: the same few hundred messages on every start, so a bug can be reproduced
let seed = 20260101;
const random = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]!;

const PEOPLE = [
  { name: "Ada Lovelace", email: "ada@analytical.example" },
  { name: "Grace Hopper", email: "grace@navy.example" },
  { name: "Alan Turing", email: "alan@bletchley.example" },
  { name: "Margaret Hamilton", email: "margaret@apollo.example" },
  { name: "Linus Torvalds", email: "linus@kernel.example" },
  { name: "Katherine Johnson", email: "katherine@nasa.example" },
  { name: "Dennis Ritchie", email: "dmr@bell-labs.example" },
  { name: "Barbara Liskov", email: "barbara@mit.example" },
  { name: "GitHub", email: "noreply@github.example" },
  { name: "Billing", email: "billing@cloud.example" },
];

const SUBJECTS = [
  "Weekly sync notes",
  "Re: Release checklist for 2.0",
  "Invoice #{n} is ready",
  "Design review: the new onboarding flow",
  "Lunch on Thursday?",
  "Your build failed on main",
  "Quarterly planning: draft attached",
  "Re: Re: Question about the API rate limits",
  "Welcome aboard",
  "Security alert: new sign-in",
  "Feedback on the proposal",
  "Meeting moved to 15:00",
  "Travel itinerary",
  "[skein] Pull request #{n} needs your review",
];

const PARAGRAPHS = [
  "Thanks for the update. I went through the notes and have a few comments below.",
  "Could you take a look before Friday? Nothing is blocked yet, but it will be soon.",
  "The numbers look right to me, though the second table doesn't add up to the total.",
  "I'll be offline tomorrow morning, so ping me in the afternoon if it is urgent.",
  "Let me know if the new schedule works for you. Happy to move things around.",
  "Attached are the latest drafts. The structure hasn't changed, only the wording.",
];

const FILES = [
  { name: "notes.pdf", size: 184_320 },
  { name: "plan.xlsx", size: 52_480 },
  { name: "mockup.png", size: 1_238_016 },
  { name: "report.docx", size: 96_256 },
  { name: "logs.zip", size: 3_407_872 },
];

const DAY = 86_400_000;
const NOW = Date.now();

/** The mailboxes an incoming message is spread over; most mail sits in the inbox. */
const SPREAD: MailboxRole[] = [
  ...Array<MailboxRole>(10).fill("inbox"),
  "archive",
  "archive",
  "junk",
  "trash",
];

function make(index: number, role: MailboxRole): Email {
  const outgoing = role === "sent" || role === "drafts";
  const person = pick(PEOPLE);
  const from = outgoing ? ME : person;
  const to = outgoing ? [person] : [ME];
  const subject = pick(SUBJECTS).replace("{n}", String(1000 + index));
  const files: Attachment[] =
    random() < 0.25
      ? Array.from({ length: 1 + Math.floor(random() * 2) }, (_, i) => ({
          id: `a-${index}-${i}`,
          ...pick(FILES),
        }))
      : [];
  const paragraphs = Array.from({ length: 2 + Math.floor(random() * 2) }, () => pick(PARAGRAPHS));
  const body = [
    `Hi ${outgoing ? person.name.split(" ")[0] : "there"},`,
    ...paragraphs,
    `— ${from.name}`,
  ].join("\n\n");
  return {
    id: `m-${index}`,
    mailboxId: mailboxId(role),
    fromName: from.name,
    fromEmail: from.email,
    toName: to[0]!.name,
    subject,
    preview: paragraphs[0]!,
    // Newest first by index: a message every few hours, back to a couple of months
    receivedAt: new Date(
      NOW - index * 3.5 * 3_600_000 - Math.floor(random() * 3_600_000),
    ).toISOString(),
    seen: role !== "inbox" || index > 14 || random() < 0.3,
    flagged: random() < 0.08,
    hasAttachment: files.length > 0,
    to,
    cc: random() < 0.15 ? [pick(PEOPLE)] : [],
    body,
    attachments: files,
  };
}

/** Every message of the mock account, newest first. */
export const emails: Email[] = Array.from({ length: 240 }, (_, i) =>
  make(i, i % 17 === 5 ? "sent" : i % 41 === 3 ? "drafts" : pick(SPREAD)),
);

export const nextEmailId = () =>
  `m-${Math.max(0, ...emails.map((e) => Number(e.id.slice(2)))) + 1}`;

/** The mailboxes with their counts, as of now. */
export function mailboxes(): Mailbox[] {
  return MAILBOX_ROLES.map((role) => {
    const inBox = emails.filter((e) => e.mailboxId === mailboxId(role));
    return {
      id: mailboxId(role),
      role,
      total: inBox.length,
      // Drafts count all of them; elsewhere only what wasn't read
      unread: role === "drafts" ? inBox.length : inBox.filter((e) => !e.seen).length,
    };
  });
}

export { DAY };
