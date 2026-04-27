import { getLocale, getTranslations } from "next-intl/server";

import { getAuthShellCopy } from "./auth-shell-content";
import type { LegalPageCopy, LegalSection } from "./legal-content";
import { normalizeLocale, type Locale } from "./locale";

type HelpCenterContent = {
  description: string;
  lastUpdated: string;
  metadataTitle: string;
  notice: string;
  sections: LegalSection[];
  title: string;
};

const HELP_CENTER_CONTENT: Record<Locale, HelpCenterContent> = {
  zh: {
    metadataTitle: "帮助中心",
    title: "帮助中心",
    description:
      "这里整理登录、资料、订单、任务和审核的常见处理方式，帮助你快速找到下一步。",
    lastUpdated: "2026-04-27",
    notice:
      "如果页面提示无法继续、资料长时间没有变化，或可见内容不符合你的工作范围，请联系系统管理员核对账号和业务关系。",
    sections: [
      {
        title: "登录与账号",
        items: [
          "忘记密码时，可以在登录页选择找回密码，并按照邮件中的提示重新设置。",
          "如果账号无法登录，请先确认邮箱、密码和验证码是否填写正确；仍无法进入时，请联系管理员核对账号状态。",
          "如果登录后进入的工作台不符合你的实际岗位，请联系管理员调整账号角色。",
        ],
      },
      {
        title: "个人资料与审核",
        items: [
          "在“我的”页面可以查看和更新个人资料，并提交身份证、护照、照片或视频等需要审核的资料。",
          "资料提交后会进入审核流程，审核结果会在页面中显示；如需补充或更正，请按照页面提示重新提交。",
          "如果资料长时间没有更新状态，请联系负责审核的管理员协助确认。",
        ],
      },
      {
        title: "订单与任务",
        items: [
          "订单、任务和佣金等内容会按照你的岗位和业务关系展示，页面中看不到的内容通常代表当前账号暂时无权查看。",
          "创建或编辑订单时，请确认客户信息、金额、补充说明和附件准确无误后再提交。",
          "领取或提交任务前，请先阅读任务要求；上传成果后等待审核结果，再根据页面提示继续处理。",
        ],
      },
      {
        title: "团队与推荐关系",
        items: [
          "团队和推荐关系由管理员维护。普通成员只能查看自己有权限访问的团队、成员和客户信息。",
          "如果团队成员、客户归属或推荐关系显示不正确，请联系管理员核对后调整。",
        ],
      },
      {
        title: "需要人工协助",
        items: [
          "遇到无法自行处理的问题时，请准备好账号邮箱、所在页面、操作时间和页面提示内容，方便管理员快速定位。",
          "涉及账号权限、资料审核、订单修改、任务异常或结算问题时，请通过公司约定的支持渠道联系管理员。",
        ],
      },
    ],
  },
  en: {
    metadataTitle: "Help Center",
    title: "Help Center",
    description:
      "Find practical guidance for sign-in, profile review, orders, tasks and workspace access.",
    lastUpdated: "2026-04-27",
    notice:
      "If a page says you cannot continue, your profile status has not changed for a long time, or the visible content does not match your work, contact an administrator to check your account and business relationship.",
    sections: [
      {
        title: "Sign-In and Account",
        items: [
          "If you forget your password, use the password recovery option on the sign-in page and follow the instructions in the email.",
          "If you cannot sign in, first check your email, password and verification code. If the issue continues, ask an administrator to check your account status.",
          "If you land in the wrong workspace after signing in, ask an administrator to adjust your account role.",
        ],
      },
      {
        title: "Profile and Reviews",
        items: [
          "Use the My Profile page to review and update your profile, and to submit ID, passport, photo or video materials when required.",
          "After submission, materials enter review. The result appears on the page, and you can follow the page prompt if a correction is needed.",
          "If the review status does not change for a long time, contact the responsible administrator for help.",
        ],
      },
      {
        title: "Orders and Tasks",
        items: [
          "Orders, tasks and commissions are shown according to your work role and business relationship. Content you cannot see is usually outside your current access range.",
          "When creating or editing an order, check the customer information, amount, notes and attachments before submitting.",
          "Before accepting or submitting a task, read the task requirements. After uploading your work, wait for the review result and follow the page prompt.",
        ],
      },
      {
        title: "Teams and Referrals",
        items: [
          "Teams and referral relationships are maintained by administrators. Members can only see teams, members and customers they are allowed to access.",
          "If team members, customer ownership or referral relationships look incorrect, contact an administrator to review and adjust them.",
        ],
      },
      {
        title: "Getting Human Help",
        items: [
          "When you need help, prepare your account email, the page you were using, the time of the operation and the message shown on the page.",
          "For account access, profile review, order changes, task issues or settlement questions, contact an administrator through the agreed company support channel.",
        ],
      },
    ],
  },
};

export async function getHelpCenterPageCopy(): Promise<LegalPageCopy> {
  const [commonT, locale, authShellCopy] = await Promise.all([
    getTranslations("Legal.common"),
    getLocale(),
    getAuthShellCopy(),
  ]);
  const content = HELP_CENTER_CONTENT[normalizeLocale(locale)];

  return {
    backHome: commonT("backHome"),
    brandSubtitle: authShellCopy.brandSubtitle,
    brandTitle: authShellCopy.brandTitle,
    description: content.description,
    draftNotice: content.notice,
    eyebrow: content.title,
    lastUpdated: content.lastUpdated,
    lastUpdatedLabel: commonT("lastUpdatedLabel"),
    nav: {
      privacy: commonT("nav.privacy"),
      terms: commonT("nav.terms"),
      help: commonT("nav.help"),
    },
    sections: content.sections,
    title: content.title,
  };
}

export async function getHelpCenterMetadata() {
  const locale = normalizeLocale(await getLocale());
  const content = HELP_CENTER_CONTENT[locale];

  return {
    description: content.description,
    title: content.metadataTitle,
  };
}
