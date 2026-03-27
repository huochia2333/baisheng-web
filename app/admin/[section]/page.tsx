import type { Metadata } from "next";

import { AdminSectionPlaceholder } from "@/components/dashboard/admin-section-placeholder";

const sectionCopy: Record<
  string,
  { title: string; description: string }
> = {
  orders: {
    title: "订单管理",
    description:
      "这里将承接管理员对订单的全量查看、筛选、状态流转和异常处理。后续我们可以基于管理员模板继续拆出业务员、财务和客户视角。",
  },
  referrals: {
    title: "推荐树",
    description:
      "这里将展示推荐关系网络、层级节点和关键业务指标，后续可以根据角色精简可见节点与操作权限。",
  },
  team: {
    title: "团队管理",
    description:
      "这里会承接团队成员、权限分组、状态统计和组织协作信息，方便从管理员视角统一管理。",
  },
  commission: {
    title: "佣金中心",
    description:
      "这里将整合佣金规则、结算明细、发放进度和异常记录，后续可在管理员基础上裁剪成财务与业务员专属界面。",
  },
  "exchange-rates": {
    title: "汇率管理",
    description:
      "这里将维护汇率来源、更新时间、历史曲线和人工校准记录，为订单和财务模块提供统一数据基础。",
  },
  tasks: {
    title: "任务看板",
    description:
      "这里会聚合待办、提醒、责任人和进度节点，帮助管理员从全局视角分派和跟进业务任务。",
  },
  reviews: {
    title: "审核中心",
    description:
      "这里将处理资料审核、实名认证、风险复核和审批流。后续运营、经理与客户角色可以从这里裁出不同的审核视图。",
  },
};

type SectionPageProps = {
  params: Promise<{ section: string }>;
};

export async function generateMetadata({
  params,
}: SectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const copy = sectionCopy[section];

  return {
    title: copy ? copy.title : "管理员工作台",
  };
}

export default async function AdminSectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  const copy = sectionCopy[section] ?? {
    title: "管理员工作台",
    description:
      "当前模块正在建设中。我们已经把管理员主界面的导航结构搭好，后续可以在这个壳子上继续扩展具体内容。",
  };

  return (
    <AdminSectionPlaceholder
      description={copy.description}
      title={copy.title}
    />
  );
}
