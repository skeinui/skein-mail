import { Splitter, toast } from "@skeinui/ui";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import type { Filter, ListResult } from "@/lib/list-query";
import { Page } from "@/skein-shell";
import { deleteEmail, fetchEmail, fetchEmails, fetchMailboxes, mailKeys, patchEmail } from "./api";
import type { Email, EmailPatch, EmailSummary, MailboxRole } from "./api";
import { ComposeDrawer } from "./components/compose-drawer";
import type { ComposeInit } from "./components/compose-drawer";
import { MailList } from "./components/mail-list";
import type { MailFilter } from "./components/mail-list";
import { MailReader } from "./components/mail-reader";
import { longDate } from "./format";
import { useMailTranslation } from "./locales";
import "./mail.css";

const PAGE_SIZE = 30;

/** One mailbox: the menu has an entry (and a route) for each, so the page is the list and the message. */
export function MailPage({ box }: { box: MailboxRole }) {
  const { t, i18n } = useMailTranslation();
  const queryClient = useQueryClient();
  const mailboxId = `mb-${box}`;
  const [filter, setFilter] = useState<MailFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  /** undefined: closed. */
  const [composing, setComposing] = useState<ComposeInit>();
  const deferredKeyword = useDeferredValue(keyword.trim());

  const mailboxes = useQuery({ queryKey: mailKeys.mailboxes, queryFn: fetchMailboxes });

  // The mailbox, unread and starred are conditions of one standard filter; the search is the keyword
  const items: Filter[] = [{ field: "mailboxId", op: "eq", value: mailboxId }];
  if (filter === "unread") items.push({ field: "seen", op: "eq", value: false });
  if (filter === "starred") items.push({ field: "flagged", op: "eq", value: true });
  const query = {
    page,
    pageSize: PAGE_SIZE,
    filter: { logic: "and" as const, items },
    ...(deferredKeyword ? { keyword: deferredKeyword } : {}),
  };
  const list = useQuery({
    queryKey: mailKeys.list(query),
    queryFn: () => fetchEmails(query),
    placeholderData: keepPreviousData,
  });
  const email = useQuery({
    queryKey: mailKeys.detail(selectedId ?? ""),
    queryFn: () => fetchEmail(selectedId!),
    enabled: Boolean(selectedId),
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["mail"] });
  const patch = useMutation({
    mutationFn: ({ id, ...p }: EmailPatch & { id: string }) => patchEmail(id, p),
    // Read state and the star show at once; a move waits for the server (the message leaves the list)
    onMutate: ({ id, seen, flagged }) => {
      const change = {
        ...(seen !== undefined && { seen }),
        ...(flagged !== undefined && { flagged }),
      };
      if (!Object.keys(change).length) return;
      queryClient.setQueriesData<ListResult<EmailSummary>>(
        { queryKey: ["mail", "emails", "list"] },
        (old) =>
          old && { ...old, items: old.items.map((m) => (m.id === id ? { ...m, ...change } : m)) },
      );
      queryClient.setQueryData<Email>(mailKeys.detail(id), (old) => old && { ...old, ...change });
    },
    // Settled either way: a failure puts back what the server has
    onSettled: refresh,
    onError: (e) => toast.danger(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteEmail(id),
    onSuccess: () => {
      toast.success(t(mailboxId === "mb-trash" ? "deletedForever" : "deleted"));
      setSelectedId(undefined);
      refresh();
    },
    onError: (e) => toast.danger(e.message),
  });

  const open = (id: string) => {
    setSelectedId(id);
    const summary = list.data?.items.find((m) => m.id === id);
    if (summary && !summary.seen) patch.mutate({ id, seen: true });
  };
  const change = (apply: () => void) => {
    apply();
    setPage(1);
    setSelectedId(undefined);
  };

  const current = email.data && email.data.id === selectedId ? email.data : undefined;
  const reply = () => {
    if (!current) return;
    const quoted = t("quoted", {
      date: longDate(current.receivedAt, i18n.language),
      name: current.fromName,
    });
    setComposing({
      to: current.fromEmail,
      subject: current.subject.startsWith(t("replyPrefix"))
        ? current.subject
        : t("replyPrefix") + current.subject,
      body: `\n\n${quoted}\n${current.body
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n")}`,
    });
  };

  const edit = () => {
    if (!current) return;
    const names = (list: Email["to"]) => list.map((a) => `${a.name} <${a.email}>`).join(", ");
    setComposing({
      draftId: current.id,
      to: names(current.to),
      cc: names(current.cc),
      subject: current.subject,
      body: current.body,
      attachments: current.attachments,
    });
  };

  return (
    <Page tabTitle={t("title")}>
      <div className="mail">
        <Splitter>
          <Splitter.Panel defaultSize={400} min={300} max={560}>
            <MailList
              title={t(`mailbox.${box}`)}
              outgoing={box === "sent" || box === "drafts"}
              unread={mailboxes.data?.find((b) => b.id === mailboxId)?.unread ?? 0}
              onCompose={() => setComposing({})}
              items={list.data?.items ?? []}
              total={list.data?.total ?? 0}
              page={page}
              pageSize={PAGE_SIZE}
              loading={list.isLoading}
              switching={list.isPlaceholderData}
              searching={filter !== "all" || deferredKeyword !== ""}
              selectedId={selectedId}
              filter={filter}
              keyword={keyword}
              onFilter={(f) => change(() => setFilter(f))}
              onKeyword={(k) => change(() => setKeyword(k))}
              onPage={setPage}
              onSelect={open}
            />
          </Splitter.Panel>
          <Splitter.Panel min={360}>
            <MailReader
              email={current}
              loading={email.isFetching}
              inTrash={mailboxId === "mb-trash"}
              inArchive={mailboxId === "mb-archive"}
              onPatch={(p) => selectedId && patch.mutate({ id: selectedId, ...p })}
              onDelete={() => selectedId && remove.mutate(selectedId)}
              onReply={reply}
              onEdit={edit}
            />
          </Splitter.Panel>
        </Splitter>
      </div>
      <ComposeDrawer
        open={composing !== undefined}
        init={composing ?? {}}
        onClose={() => setComposing(undefined)}
        onSaved={() => composing?.draftId && setSelectedId(undefined)}
      />
    </Page>
  );
}
