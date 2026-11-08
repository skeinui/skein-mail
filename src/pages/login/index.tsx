import { Alert, Flex, LoginLayout, Text, toast } from "@skeinui/ui";
import type { LoginLayoutVariant } from "@skeinui/ui";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Toolbar } from "@/modules/toolbar";
import { settings } from "@/settings";
import { useAuthStore } from "@/store/auth-store";
import { login } from "./api";
import { LayoutSwitch } from "./components/layout-switch";
import { LoginForm } from "./components/login-form";
import { useLoginTranslation } from "./locales";

const VARIANT_KEY = `${settings.storageKey}-login-layout`;

/** The look picked last time on this browser, else `settings.loginLayout`. */
function storedVariant(): LoginLayoutVariant {
  try {
    const saved = localStorage.getItem(VARIANT_KEY);
    if (saved === "centered" || saved === "split" || saved === "cover") return saved;
  } catch {
    // Blocked storage: the default
  }
  return settings.loginLayout;
}

export function LoginPage() {
  const { t } = useLoginTranslation();
  const navigate = useNavigate();
  // The session ended by itself (lib/http.ts): say so
  const expired = useAuthStore((s) => s.expired);
  const [variant, setVariant] = useState<LoginLayoutVariant>(storedVariant);
  const chooseVariant = (next: LoginLayoutVariant) => {
    setVariant(next);
    try {
      localStorage.setItem(VARIANT_KEY, next);
    } catch {
      // No storage: the choice lasts until the page is left
    }
  };
  const signIn = useMutation({
    mutationFn: login,
    onSuccess: ({ token, refreshToken, user }) => {
      const { setSession, intendedPath, setIntendedPath } = useAuthStore.getState();
      setSession(token, user, refreshToken);
      setIntendedPath(null);
      void navigate({ to: intendedPath ?? "/" });
    },
    onError: (error) => toast.danger(error.message || t("failed")),
  });

  return (
    <LoginLayout
      variant={variant}
      coverTitle={t("cover.title")}
      coverDescription={t("cover.description")}
      brand={
        <span className="app-logo">
          <img src="/favicon.svg" alt="" width={24} height={24} />
          {settings.appName}
        </span>
      }
      title={t("title")}
      description={t("subtitle")}
      toolbar={
        <>
          <LayoutSwitch value={variant} onValueChange={chooseVariant} />
          <Toolbar place="login" />
        </>
      }
      footer={<Text tone="secondary">{t("mockHint")}</Text>}
    >
      <Flex direction="column" gap="lg">
        {expired ? <Alert color="warning">{t("expired")}</Alert> : null}
        <LoginForm
          // The error is shown by onError; don't let the rejection escape the form
          onSubmit={(input) =>
            signIn.mutateAsync(input).then(
              () => undefined,
              () => undefined,
            )
          }
        />
      </Flex>
    </LoginLayout>
  );
}
