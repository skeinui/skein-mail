import { QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, en, Toaster } from "@skeinui/ui";
import { zhCN } from "@skeinui/ui/locales/zh-CN";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { queryClient } from "@/lib/query-client";
import { resolveThemeStyle, usePreferencesStore, useThemeStyle } from "@/skein-shell";

/** ConfigProvider writes the theme style and the mode to <html>, so overlays portalled to <body> follow. */
export function AppProviders({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const zh = i18n.language.startsWith("zh");
  const mode = usePreferencesStore((s) => s.mode);
  // The theme style picked in the preferences drawer; it takes effect once its CSS has loaded
  const themeStyle = useThemeStyle(
    resolveThemeStyle(usePreferencesStore((s) => s.layout.themeStyle)),
  );
  return (
    <ConfigProvider
      themeStyle={themeStyle}
      mode={mode}
      locale={zh ? "zh-CN" : "en"}
      labels={zh ? zhCN.labels : en.labels}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <Toaster position="top-right" richColors />
    </ConfigProvider>
  );
}
