import type { Locale } from "./locale";

export const companyConfig = {
  defaultPublicOrigin: "https://account.pt5china.com",
  enabledBusinessKeys: ["tourism", "wholesale"],
  logoSrc: "/images/pt5-logo.png",
  supportEmail: "support@pt5china.com",
  text: {
    en: {
      accountName: "Baisheng account",
      assistantName: "Baisheng Assistant",
      brandSubtitle: "Curated Management Workspace",
      copyright: "© 2026 Baisheng Management System",
      inviteAccessDescription:
        "Baisheng currently uses invitation-based access to maintain service quality. Contact an administrator or your referrer if you need an invite code.",
      productDescription:
        "Sign-in, registration and workspace flows for the Baisheng Management System.",
      productName: "Baisheng Management System",
      registerAsideTitle: "Request Access to<br></br>Baisheng Workspace",
      registerHeaderTitle: "Create Your Account",
    },
    zh: {
      accountName: "柏盛账号",
      assistantName: "柏盛助手",
      brandSubtitle: "精选管理工作台",
      copyright: "© 2026 柏盛管理系统",
      inviteAccessDescription:
        "柏盛目前采用邀请制以保障服务质量。如果您尚未获得邀请码，请联系系统管理员或推荐人。",
      productDescription: "柏盛管理系统的登录、注册与业务工作台。",
      productName: "柏盛管理系统",
      registerAsideTitle: "申请加入<br></br>柏盛工作台",
      registerHeaderTitle: "注册柏盛账号",
    },
  },
} as const;

export type EnabledCompanyBusinessKey =
  (typeof companyConfig.enabledBusinessKeys)[number];

export type CompanyText = (typeof companyConfig.text)[Locale];

export function getCompanyText(locale: Locale): CompanyText {
  return companyConfig.text[locale];
}

export function getCompanyPublicOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || companyConfig.defaultPublicOrigin;
}
