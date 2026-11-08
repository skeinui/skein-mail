import { Button, Drawer, Field, Flex, Input, Textarea, Upload, toast } from "@skeinui/ui";
import type { UploadFile } from "@skeinui/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { sendEmail } from "../api";
import type { EmailInput } from "../api";
import { useMailTranslation } from "../locales";

/** What the drawer opens with: empty, or a reply. */
export interface ComposeInit {
  /** A draft being edited. */
  draftId?: string;
  to?: string;
  cc?: string;
  attachments?: { name: string; size: number }[];
  subject?: string;
  body?: string;
}

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/** `"a@x.com, Bob <b@y.com>"` → the addresses; the first one that isn't an address is returned as `bad`. */
function parseAddresses(text: string) {
  const list = text
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const bad = list.find((s) => !EMAIL.test(/<(.+)>/.exec(s)?.[1] ?? s));
  return { list, bad };
}

export function ComposeDrawer({
  open,
  init,
  onClose,
  onSaved,
}: {
  open: boolean;
  init: ComposeInit;
  onClose: () => void;
  /** Sent or saved: a draft being edited is replaced by the result. */
  onSaved: () => void;
}) {
  // The drawer content is mounted while open, so its state starts from `init` every time
  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <Drawer.Content size="lg">
        {open ? <ComposeForm init={init} onClose={onClose} onSaved={onSaved} /> : null}
      </Drawer.Content>
    </Drawer>
  );
}

function ComposeForm({
  init,
  onClose,
  onSaved,
}: {
  init: ComposeInit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useMailTranslation();
  const queryClient = useQueryClient();
  const [to, setTo] = useState(init.to ?? "");
  const [cc, setCc] = useState(init.cc ?? "");
  const [subject, setSubject] = useState(init.subject ?? "");
  const [body, setBody] = useState(init.body ?? "");
  const [files, setFiles] = useState<UploadFile[]>(
    (init.attachments ?? []).map((a, i) => ({
      id: `kept-${i}`,
      name: a.name,
      size: a.size,
      status: "done" as const,
      progress: 100,
    })),
  );
  const [error, setError] = useState<string>();

  const submit = useMutation({
    mutationFn: sendEmail,
    onSuccess: (_, input) => {
      toast.success(t(input.draft ? "draftSaved" : "sent"));
      void queryClient.invalidateQueries({ queryKey: ["mail"] });
      onSaved();
      onClose();
    },
    onError: (e) => toast.danger(e.message),
  });

  const run = (draft: boolean) => {
    const recipients = parseAddresses(to);
    const copies = parseAddresses(cc);
    const bad = recipients.bad ?? copies.bad;
    if (!draft && !recipients.list.length) return setError(t("needRecipient"));
    if (bad) return setError(t("badAddress", { address: bad }));
    setError(undefined);
    const input: EmailInput = {
      to: recipients.list,
      cc: copies.list,
      subject,
      body,
      attachments: files.map((f) => ({ name: f.name, size: f.size ?? 0 })),
      draft,
      replaces: init.draftId,
    };
    submit.mutate(input);
  };

  return (
    <>
      <Drawer.Title>{t("composeTitle")}</Drawer.Title>
      <Drawer.Body>
        <Flex direction="column" gap="md">
          <Field name="to" invalid={Boolean(error)}>
            <Field.Label>{t("form.to")}</Field.Label>
            <Input type="text" value={to} onValueChange={setTo} />
            <Field.Description>{t("form.toHint")}</Field.Description>
            {error ? <Field.Error match>{error}</Field.Error> : null}
          </Field>
          <Field name="cc">
            <Field.Label>{t("form.cc")}</Field.Label>
            <Input type="text" value={cc} onValueChange={setCc} />
          </Field>
          <Field name="subject">
            <Field.Label>{t("form.subject")}</Field.Label>
            <Input type="text" value={subject} onValueChange={setSubject} />
          </Field>
          <Field name="body">
            <Field.Label>{t("form.body")}</Field.Label>
            <Textarea
              autoSize={{ minRows: 10, maxRows: 20 }}
              value={body}
              onValueChange={setBody}
            />
          </Field>
          <Upload
            variant="button"
            multiple
            title={t("form.attach")}
            files={files}
            onFilesAdded={(added) =>
              setFiles((prev) => [
                ...prev,
                ...added.map((file) => ({
                  id: `${file.name}-${file.size}-${prev.length}-${Math.random()}`,
                  name: file.name,
                  size: file.size,
                  status: "done" as const,
                  progress: 100,
                })),
              ])
            }
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          />
        </Flex>
      </Drawer.Body>
      <Drawer.Footer>
        <Button
          variant="ghost"
          color="neutral"
          disabled={submit.isPending}
          onClick={() => run(true)}
        >
          {t("saveDraft")}
        </Button>
        <Button loading={submit.isPending} onClick={() => run(false)}>
          {t("send")}
        </Button>
      </Drawer.Footer>
    </>
  );
}
