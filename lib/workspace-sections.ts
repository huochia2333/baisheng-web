export const workspaceSectionCopy: Record<
  string,
  { title: string; description: string }
> = {
  orders: {
    title: "订单管理",
    description:
      "这里将承接订单的查看、筛选、状态流转和异常处理，后续会继续按管理员、业务员、财务和客户角色拆分视图。",
  },
  referrals: {
    title: "推荐树",
    description:
      "这里将展示推荐关系网络、层级节点和关键业务指标，后续可以根据角色精简可见节点与操作权限。",
  },
  team: {
    title: "团队管理",
    description:
      "这里会承接团队成员、状态统计和组织协作信息，并逐步按不同角色补齐对应操作能力。",
  },
  commission: {
    title: "佣金中心",
    description:
      "这里将整合佣金规则、结算明细、发放进度和异常记录，后续会继续细化成财务与业务员专属界面。",
  },
  "exchange-rates": {
    title: "汇率管理",
    description:
      "这里将维护汇率来源、更新时间、历史曲线和人工校准记录，为订单和财务模块提供统一数据基础。",
  },
  tasks: {
    title: "任务看板",
    description:
      "这里会聚合待办、提醒、责任人和进度节点，帮助不同岗位持续跟进业务任务。",
  },
  reviews: {
    title: "审核中心",
    description:
      "这里将处理资料审核、实名认证、风险复核和审批流。后续运营、经理与客户角色可以从这里裁出不同的审核视图。",
  },
};

export function getWorkspaceSectionCopy(section: string) {
  return workspaceSectionCopy[section] ?? null;
}
