import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "./root.css";

import { getCompanyText } from "@/lib/company-config";
import { getDocumentLanguage, normalizeLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale(await getLocale());
  const companyText = getCompanyText(locale);

  return {
    title: {
      default: companyText.productName,
      template: `%s | ${companyText.productName}`,
    },
    description: companyText.productDescription,
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
  const locale = normalizeLocale(await getLocale());

  return (
    <html
      lang={getDocumentLanguage(locale)}
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
