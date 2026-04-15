import type { ReactNode } from "react";

import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import { getScopedMessages } from "@/lib/i18n-messages";
import type { Locale } from "@/lib/locale";

type ScopedIntlProviderProps = {
  children: ReactNode;
  namespaces: readonly string[];
};

export async function ScopedIntlProvider({
  children,
  namespaces,
}: ScopedIntlProviderProps) {
  const locale = (await getLocale()) as Locale;
  const messages = await getScopedMessages(locale, namespaces);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
