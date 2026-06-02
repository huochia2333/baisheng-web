import {
  getDefaultWorkspaceBasePath,
  type AppRole,
} from "@/lib/auth-routing";
import {
  getWorkspaceConfigByBasePath,
  getWorkspaceConfigForPathname,
  type WorkspaceNavItem,
  type WorkspaceNavLabelKey,
  type WorkspacePageVariants,
  type WorkspaceRouteConfig,
} from "@/lib/workspace-config";

const ROLE_LABELS = {
  administrator: "管理员",
  client: "客户",
  finance: "财务",
  manager: "经理",
  operator: "运营",
  recruiter: "招聘员",
  salesman: "业务员",
} as const satisfies Record<AppRole, string>;

const NAV_LABELS = {
  announcements: "公告管理",
  commission: "佣金",
  exchangeRates: "汇率",
  feedback: "反馈管理",
  home: "首页",
  my: "我的",
  orders: "订单",
  people: "人员管理",
  records: "操作记录",
  referrals: "推荐树",
  reviews: "审核",
  tasks: "任务",
  team: "团队",
} as const satisfies Record<WorkspaceNavLabelKey, string>;

const NAV_ENTRY_DESCRIPTIONS = {
  announcements: "发布和管理系统公告",
  commission: "查看或处理订单佣金与任务奖励",
  exchangeRates: "查看当前可用汇率",
  feedback: "管理员查看和跟进用户反馈",
  home: "查看问候、公告和当前提醒",
  my: "从头像进入个人资料、邀请码和账号入口",
  orders: "查看或处理当前账号可见的订单",
  people: "管理账号、状态、角色和业务范围",
  records: "查看重要处理动作的留痕",
  referrals: "按当前可见业务板块查看推荐关系和邀请码线索",
  reviews: "处理资料和媒体审核",
  tasks: "查看、领取、提交或管理任务",
  team: "查看当前账号可见的团队范围",
} as const satisfies Record<WorkspaceNavLabelKey, string>;

const SYSTEM_UPDATE_GUIDES = [
  "推荐树、邀请码、团队范围和部分订单/人员范围会按业务板块区分；回答时不要把零售和批发混在一起，也不要引导用户选择当前未开放的业务。",
  "任务支持按目标角色发放、多人分别领取、分别提交审核；管理员可以设置提交任务时是否必须上传文件。",
  "管理员可以通过操作记录核对重要处理动作，也可以通过反馈管理跟进用户提交的问题。",
  "个人照片上传后的图片初审只是辅助检查，是否通过以审核结果和页面提示为准。",
  "注册或邀请码遇到问题时，引导用户确认推荐人发送的完整邀请码、返回登录，或联系管理员查看，不要把它说成系统故障。",
] as const;

type AssistantWorkspaceContext = {
  currentPageGuide: string;
  roleGuide: string;
  roleLabel: string;
  systemGuide: string;
};

export function buildAssistantWorkspaceContext({
  pathname,
  role,
}: {
  pathname: string;
  role: AppRole | null;
}): AssistantWorkspaceContext {
  const roleConfig = getRoleWorkspaceConfig(role);
  const currentPageConfig = getWorkspaceConfigForPathname(pathname);
  const roleLabel = role ? ROLE_LABELS[role] : "未确认";

  return {
    currentPageGuide: buildCurrentPageGuide(pathname, currentPageConfig),
    roleGuide: roleConfig
      ? buildRoleGuide(roleConfig)
      : "当前账号角色暂未确认，只能回答通用工作台问题。",
    roleLabel,
    systemGuide: buildSystemGuide(roleConfig),
  };
}

function getRoleWorkspaceConfig(role: AppRole | null) {
  if (!role) {
    return null;
  }

  return getWorkspaceConfigByBasePath(getDefaultWorkspaceBasePath(role));
}

function buildRoleGuide(config: WorkspaceRouteConfig) {
  const entries = config.navItems.map((item) => buildNavEntryGuide(config, item));
  const profileEntry = `${NAV_LABELS.my}：${NAV_ENTRY_DESCRIPTIONS.my}`;

  return `${ROLE_LABELS[config.authRole]}可使用：${[...entries, profileEntry].join("；")}。`;
}

function buildNavEntryGuide(
  config: WorkspaceRouteConfig,
  item: WorkspaceNavItem,
) {
  return `${NAV_LABELS[item.labelKey]}：${getNavEntryDescription(config, item)}`;
}

function getNavEntryDescription(
  config: WorkspaceRouteConfig,
  item: WorkspaceNavItem,
) {
  if (config.routeSegment === "salesman" && item.segment === "orders") {
    return "按当前账号可见业务处理订单；如果页面没有该入口，以当前工作台实际显示为准";
  }

  if (config.routeSegment === "salesman" && item.segment === "people") {
    return "拥有批发客户管理入口时使用；如果页面没有该入口，以当前工作台实际显示为准";
  }

  return NAV_ENTRY_DESCRIPTIONS[item.labelKey];
}

function buildCurrentPageGuide(
  pathname: string,
  currentPageConfig: WorkspaceRouteConfig | null,
) {
  if (!pathname || pathname === "/") {
    return "当前页面未确认，回答时优先按当前角色可用入口引导。";
  }

  if (!currentPageConfig) {
    return "当前页面不属于工作台页面，不要据此推断业务数据。";
  }

  const section = pathname
    .replace(`${currentPageConfig.basePath}/`, "")
    .split("/")[0];
  const navItem = currentPageConfig.navItems.find(
    (item) => item.segment === section,
  );

  if (section === "my") {
    return `${ROLE_LABELS[currentPageConfig.authRole]}当前在“我的”页面，只能说明个人资料、邀请码和账号入口相关操作。`;
  }

  if (!navItem) {
    return `${ROLE_LABELS[currentPageConfig.authRole]}当前页面没有明确匹配到左侧入口，不要据此扩展功能。`;
  }

  const description = getNavEntryDescription(currentPageConfig, navItem);

  return `${ROLE_LABELS[currentPageConfig.authRole]}当前在“${NAV_LABELS[navItem.labelKey]}”页面，主要用途是${description}。`;
}

function buildSystemGuide(config: WorkspaceRouteConfig | null) {
  const pageVariantGuide = config
    ? buildPageVariantGuide(config.pageVariants)
    : "角色未确认时，不要承诺任何专属入口。";

  return [pageVariantGuide, ...SYSTEM_UPDATE_GUIDES].join("\n- ");
}

function buildPageVariantGuide(pageVariants: WorkspacePageVariants) {
  const roleNotes = [
    pageVariants.orders ? getOrdersGuide(pageVariants.orders) : null,
    pageVariants.people ? getPeopleGuide(pageVariants.people) : null,
    pageVariants.tasks ? getTasksGuide(pageVariants.tasks) : null,
    pageVariants.commission ? getCommissionGuide(pageVariants.commission) : null,
    pageVariants.exchangeRates === "manage"
      ? "汇率设置由管理员在订单相关页面处理。"
      : null,
    pageVariants.feedback ? "反馈管理只用于管理员查看和处理用户反馈。" : null,
    pageVariants.records ? "操作记录只用于管理员核对重要处理动作。" : null,
    pageVariants.reviews ? "审核中心由管理员处理资料和媒体审核。" : null,
  ].filter(Boolean);

  if (roleNotes.length === 0) {
    return "当前角色只开放基础工作台入口，回答时不要扩展管理员或内部处理能力。";
  }

  return roleNotes.join(" ");
}

function getOrdersGuide(mode: WorkspacePageVariants["orders"]) {
  if (mode === "admin") {
    return "管理员订单页用于订单处理，并包含汇率设置入口。";
  }

  if (mode === "salesman") {
    return "业务员订单页按当前账号可见业务范围展示订单。";
  }

  return "客户订单页用于查看自己的订单。";
}

function getPeopleGuide(mode: WorkspacePageVariants["people"]) {
  if (mode === "admin") {
    return "管理员人员管理用于调整账号状态、角色和业务范围。";
  }

  return "业务员人员入口按当前账号的业务范围展示客户管理内容。";
}

function getTasksGuide(mode: WorkspacePageVariants["tasks"]) {
  if (mode === "admin") {
    return "管理员任务页用于发布、分派、查看领取进度、处理任务详情和任务审核。";
  }

  return "内部成员任务页用于查看可见任务、领取任务、提交成果并等待审核。";
}

function getCommissionGuide(mode: WorkspacePageVariants["commission"]) {
  if (mode === "admin") {
    return "管理员佣金页用于复核和处理订单佣金与任务奖励。";
  }

  return "业务员佣金页用于查看自己的订单佣金和任务奖励。";
}
