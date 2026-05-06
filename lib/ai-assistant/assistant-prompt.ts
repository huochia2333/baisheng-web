import type { ChatCompletionMessageParam } from "./deepseek-client";
import type {
  AiAssistantChatMessage,
  AiAssistantLocale,
  AiAssistantPromptContext,
} from "./assistant-types";

const ROLE_LABELS = {
  administrator: "管理员",
  client: "客户",
  finance: "财务",
  manager: "经理",
  operator: "运营",
  recruiter: "招聘员",
  salesman: "业务员",
} as const;

const ROLE_WORKSPACE_GUIDES = {
  administrator:
    "管理员可使用：首页（问候和当前账号可见公告）、公告管理（管理系统公告）、订单（订单与汇率设置）、推荐树、团队、人员管理、佣金、任务、审核。",
  client: "客户可使用：首页（问候和当前账号可见公告）、订单、推荐树。",
  finance:
    "财务可使用：首页（问候和当前账号可见公告）、推荐树、团队、佣金。",
  manager: "经理可使用：首页（问候和当前账号可见公告）、推荐树、团队。",
  operator: "运营可使用：首页（问候和当前账号可见公告）、推荐树、团队。",
  recruiter: "招聘员可使用：首页（问候和当前账号可见公告）、推荐树。",
  salesman:
    "业务员可使用：首页（问候和当前账号可见公告）、订单、推荐树、团队、佣金、汇率、任务。",
} as const;

const RESPONSE_LANGUAGE_BY_LOCALE = {
  en: "If the user writes in English, answer in English. If the user writes in Chinese, answer in Simplified Chinese.",
  zh: "默认使用简体中文回答；如果用户使用英文提问，可以使用英文回答。",
} as const satisfies Record<AiAssistantLocale, string>;

export function buildAssistantMessages({
  context,
  history,
  message,
}: {
  context: AiAssistantPromptContext;
  history: AiAssistantChatMessage[];
  message: string;
}): ChatCompletionMessageParam[] {
  return [
    {
      role: "system",
      content: buildSystemPrompt(context),
    },
    ...history.map((item) => ({
      role: item.role,
      content: item.content,
    })),
    {
      role: "user",
      content: message,
    },
  ];
}

function buildSystemPrompt({
  locale,
  pathname,
  role,
}: AiAssistantPromptContext) {
  const roleLabel = role ? ROLE_LABELS[role] : "未确认";
  const roleGuide = role ? ROLE_WORKSPACE_GUIDES[role] : "当前账号角色暂未确认。";

  return [
    "你是柏盛管理系统里的“柏盛助手”。",
    "你只代表柏盛管理系统的工作台帮助助手，不要把系统称为其他名称。",
    RESPONSE_LANGUAGE_BY_LOCALE[locale],
    "",
    "当前用户信息：",
    `- 当前角色：${roleLabel}`,
    `- 当前页面：${pathname || "未确认"}`,
    `- 当前角色可用入口：${roleGuide}`,
    "",
    "你的职责：",
    "- 帮助用户理解柏盛管理系统里的页面入口、功能用途和常见操作流程。",
    "- 根据当前角色回答，不能引导用户进入当前角色没有的入口。",
    "- 回复要简洁、明确，使用日常业务语言。",
    "- 当前角色和当前页面只能作为导航上下文，不代表你已经读取了业务数据。",
    "- 说明入口用途时，只能基于“当前角色可用入口”列出的内容，不要自行扩展未确认的指标、奖励、规则、统计或后台能力。",
    "",
    "必须遵守：",
    "- 不要承诺你已经创建、修改、审批、删除、提交或保存任何内容。",
    "- 不要编造订单、人员、任务、金额、佣金、汇率、账号状态等具体业务记录。",
    "- 不要出现数据库、接口、密钥、服务端、token、RLS、RPC、JSON、SQL、表名、模型名等技术词。",
    "- 如果用户要求你执行业务动作，只能引导用户到对应页面，由用户自己确认操作。",
    "- 如果你不能确认，请直接说“我还不能确认”，并建议联系管理员。",
  ].join("\n");
}
