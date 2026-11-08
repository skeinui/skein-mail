import { Avatar, Badge, Button, Empty, Flex, Markdown, Popconfirm, Spinner } from "@skeinui/ui";
import {
  Archive,
  FileText,
  Inbox,
  MailOpen,
  Paperclip,
  Pencil,
  Reply,
  Star,
  Trash2,
} from "lucide-react";
import type { Email, EmailPatch } from "../api";
import { fileSize, initials, longDate } from "../format";
import { useMailTranslation } from "../locales";

const people = (list: Email["to"]) => list.map((a) => `${a.name} <${a.email}>`).join(", ");

/** The message opened: its actions, the people, the attachments and the text. */
export function MailReader({
  email,
  loading,
  inTrash,
  inArchive,
  onPatch,
  onDelete,
  onReply,
  onEdit,
}: {
  email: Email | undefined;
  loading: boolean;
  inTrash: boolean;
  inArchive: boolean;
  onPatch: (patch: EmailPatch) => void;
  onDelete: () => void;
  onReply: () => void;
  onEdit: () => void;
}) {
  const { t, i18n } = useMailTranslation();
  if (!email) {
    return (
      <section className="mail-reader mail-reader-empty">
        {loading ? (
          <Spinner />
        ) : (
          <Empty
            icon={<MailOpen size={40} />}
            title={t("pickOne")}
            description={t("pickOneHint")}
          />
        )}
      </section>
    );
  }
  const draft = email.mailboxId === "mb-drafts";
  return (
    <section className="mail-reader" aria-label={email.subject || t("noSubject")}>
      <div className="mail-reader-tools">
        {draft ? (
          <Button variant="ghost" size="sm" startContent={<Pencil size={16} />} onClick={onEdit}>
            {t("action.edit")}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" startContent={<Reply size={16} />} onClick={onReply}>
            {t("action.reply")}
          </Button>
        )}
        <Flex gap="xs">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={email.flagged ? t("action.unstar") : t("action.star")}
            aria-pressed={email.flagged}
            onClick={() => onPatch({ flagged: !email.flagged })}
          >
            <Star
              size={16}
              className={email.flagged ? "mail-star" : undefined}
              fill={email.flagged ? "currentColor" : "none"}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t("action.markUnread")}
            onClick={() => onPatch({ seen: false })}
          >
            <MailOpen size={16} />
          </Button>
          {inArchive || inTrash ? (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={t("action.toInbox")}
              onClick={() => onPatch({ mailboxId: "mb-inbox" })}
            >
              <Inbox size={16} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={t("action.archive")}
              onClick={() => onPatch({ mailboxId: "mb-archive" })}
            >
              <Archive size={16} />
            </Button>
          )}
          {inTrash ? (
            // Deleting from the trash can't be undone: ask first
            <Popconfirm
              title={t("confirmForever")}
              description={t("confirmForeverHint")}
              tone="danger"
              side="bottom"
              align="end"
              confirmLabel={t("action.deleteForever")}
              onConfirm={onDelete}
            >
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                color="danger"
                aria-label={t("action.deleteForever")}
              >
                <Trash2 size={16} />
              </Button>
            </Popconfirm>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              color="danger"
              aria-label={t("action.delete")}
              onClick={onDelete}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </Flex>
      </div>
      <div className="mail-reader-scroll">
        <h2 className="mail-subject">
          {email.subject || t("noSubject")}
          {draft ? (
            <Badge size="sm" color="warning">
              <FileText size={12} /> {t("mailbox.drafts")}
            </Badge>
          ) : null}
        </h2>
        <div className="mail-sender">
          <Avatar fallback={initials(email.fromName)} />
          <div className="mail-sender-text">
            <div>
              <strong>{email.fromName}</strong>{" "}
              <span className="mail-muted">&lt;{email.fromEmail}&gt;</span>
            </div>
            <div className="mail-muted">
              {t("to")}: {people(email.to)}
              {email.cc.length ? ` · ${t("cc")}: ${people(email.cc)}` : ""}
            </div>
          </div>
          <time className="mail-muted" dateTime={email.receivedAt}>
            {longDate(email.receivedAt, i18n.language)}
          </time>
        </div>
        {email.attachments.length ? (
          <div className="mail-attachments">
            <div className="mail-muted">
              <Paperclip size={14} /> {t("attachments", { count: email.attachments.length })}
            </div>
            <Flex gap="sm" wrap>
              {email.attachments.map((a) => (
                <Badge key={a.id} variant="outline" size="lg">
                  {a.name} · {fileSize(a.size)}
                </Badge>
              ))}
            </Flex>
          </div>
        ) : null}
        <div className="mail-body">
          <Markdown breaks>{email.body}</Markdown>
        </div>
      </div>
    </section>
  );
}
