import type { Metadata } from "next";
import { Noto_Sans_SC, Plus_Jakarta_Sans } from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import "./root.css";

import { getDocumentLanguage } from "@/lib/locale";

const notoSansSC = Noto_Sans_SC({
  display: "swap",
  preload: false,
  variable: "--font-body-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  display: "swap",
  variable: "--font-ui-label",
  preload: false,
  subsets: ["latin"],
  weight: ["400", "600"],
});

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
      className={`${notoSansSC.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
