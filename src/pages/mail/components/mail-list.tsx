import { Avatar, Badge, Button, List, Pagination, SearchInput, Segmented } from "@skeinui/ui";
import { Paperclip, PenSquare, Star } from "lucide-react";
import type { EmailSummary } from "../api";
import { initials, shortDate } from "../format";
import { useMailTranslation } from "../locales";

export type MailFilter = "all" | "unread" | "starred";

export function MailList({
  title,
  outgoing,
  unread,
  onCompose,
  items,
  total,
  page,
  pageSize,
  loading,
  switching,
  searching,
  selectedId,
  filter,
  keyword,
  onFilter,
  onKeyword,
  onPage,
  onSelect,
}: {
  title: string;
  /** Sent and drafts: a row names who the message is to, not who it is from (that is always you). */
  outgoing: boolean;
  unread: number;
  onCompose: () => void;
  items: EmailSummary[];
  total: number;
  page: number;
  pageSize: number;
  /** The first load, nothing to show yet. */
  loading: boolean;
  /** The rows are the previous query's while the new one loads: keep them, only dim them. */
  switching: boolean;
  /** A keyword or a filter is on: the empty list says nothing matched, not that the mailbox is empty. */
  searching: boolean;
  selectedId: string | undefined;
  filter: MailFilter;
  keyword: string;
  onFilter: (filter: MailFilter) => void;
  onKeyword: (keyword: string) => void;
  onPage: (page: number) => void;
  onSelect: (id: string) => void;
}) {
  const { t, i18n } = useMailTranslation();
  return (
    <section className="mail-list" aria-label={t("title")}>
      <div className="mail-list-head">
        <h2 className="mail-list-title">
          {title}
          {unread > 0 ? (
            <Badge size="sm" color="primary">
              {unread}
            </Badge>
          ) : null}
        </h2>
        <Button size="sm" startContent={<PenSquare size={16} />} onClick={onCompose}>
          {t("compose")}
        </Button>
      </div>
      <div className="mail-list-tools">
        <SearchInput
          fullWidth
          aria-label={t("search")}
          placeholder={t("search")}
          value={keyword}
          onValueChange={onKeyword}
        />
        <Segmented
          size="sm"
          aria-label={t("filter.label")}
          value={filter}
          onValueChange={(v) => onFilter(v as MailFilter)}
          options={[
            { value: "all", label: t("filter.all") },
            { value: "unread", label: t("filter.unread") },
            { value: "starred", label: t("filter.starred") },
          ]}
        />
      </div>
      <div className="mail-list-scroll" data-switching={switching || undefined}>
        <List
          loading={loading}
          // The first load has no rows yet: no "empty" text under the spinner, only room for it
          empty={
            loading ? (
              <div className="mail-list-blank" />
            ) : searching ? (
              t("emptySearch")
            ) : (
              t("emptyList")
            )
          }
          items={items.map((mail) => ({
            key: mail.id,
            title: (
              <button
                type="button"
                className="mail-row"
                data-unread={!mail.seen || undefined}
                aria-current={mail.id === selectedId || undefined}
                onClick={() => onSelect(mail.id)}
              >
                <Avatar size="sm" fallback={initials(outgoing ? mail.toName : mail.fromName)} />
                <span className="mail-row-main">
                  <span className="mail-row-head">
                    <span className="mail-row-from">
                      {outgoing ? `${t("to")}: ${mail.toName}` : mail.fromName}
                    </span>
                    <span className="mail-row-date">
                      {shortDate(mail.receivedAt, i18n.language)}
                    </span>
                  </span>
                  <span className="mail-row-subject">{mail.subject || t("noSubject")}</span>
                  <span className="mail-row-foot">
                    <span className="mail-row-preview">{mail.preview}</span>
                    {mail.hasAttachment ? <Paperclip size={14} aria-hidden /> : null}
                    {mail.flagged ? (
                      <Star size={14} className="mail-star" fill="currentColor" aria-hidden />
                    ) : null}
                  </span>
                </span>
              </button>
            ),
          }))}
        />
      </div>
      <div className="mail-list-foot">
        <Pagination size="sm" page={page} pageSize={pageSize} total={total} onPageChange={onPage} />
      </div>
    </section>
  );
}
