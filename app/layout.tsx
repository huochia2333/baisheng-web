import type { Metadata } from "next";
import { Noto_Sans_SC, Plus_Jakarta_Sans } from "next/font/google";
import "./auth.css";

const notoSansSC = Noto_Sans_SC({
  variable: "--font-body-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-ui-label",
  preload: false,
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "柏盛管理系统",
    template: "%s | 柏盛管理系统",
  },
  description: "柏盛管理系统的登录、注册与业务工作台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSansSC.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
