import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import "./root.css";

import { getDocumentLanguage } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const appTitle = t("appTitle");

  return {
    title: {
      default: appTitle,
      template: `%s | ${appTitle}`,
    },
    description: t("appDescription"),
    icons: {
      icon: [{ url: "/icon.png", type: "image/png" }],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={getDocumentLanguage(locale as "zh" | "en")}
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
