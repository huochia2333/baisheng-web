# 柏盛管理系统 Web 前端

柏盛管理系统 Web 端，基于 `Next.js 16 App Router`、`React 19`、`TypeScript`、`Tailwind CSS 4`、`Supabase` 和 `next-intl` 构建。

项目目录：`D:\code\code-project\baisheng-web`

## 技术栈

- `Next.js 16` + App Router
- `React 19`
- `TypeScript 5`
- `Tailwind CSS 4`
- `Supabase Auth` / `@supabase/ssr` / `@supabase/supabase-js`
- `next-intl` 中英文双语
- `Playwright` 真实浏览器验证

## 当前架构

项目已经从早期按角色散落的静态目录，收口到统一的动态工作台结构：

- `app/(auth)`：认证页，包含 `/`、`/login`、`/register`、`/forgot-password`
- `app/(workspace)/[workspace]/my`：各角色共享“我的”页面入口
- `app/(workspace)/[workspace]/[section]`：按角色动态装配订单、推荐树、团队、佣金、汇率、任务、审核等页面
- `app/forbidden.tsx`：统一承接越权访问时的访问错误页
- `proxy.ts`：会话同步、登录保护、工作台访问前置校验
- `lib/workspace-config.ts`：角色导航、页面变体和工作台配置中心
- `lib/auth-routing.ts`：角色与工作台 base path 的映射

## 角色与入口

当前工作台基于以下角色 base path：

| 角色 | 默认入口 | 当前重点模块 |
| --- | --- | --- |
| `administrator` | `/admin/my` | `my`、`orders`、`referrals`、`team`、`commission`、`exchange-rates`、`tasks`、`reviews` |
| `salesman` | `/salesman/my` | `my`、`orders`、`referrals`、`team`、`commission`、`exchange-rates`、`tasks` |
| `client` | `/client/my` | `my`、`orders`、`referrals`、`team` |
| `manager` | `/manager/my` | `my`、`referrals`、`team` |
| `operator` | `/operator/my` | `my`、`referrals`、`team` |
| `finance` | `/finance/my` | `my`、`referrals`、`team`、`commission` |
| `recruiter` | `/recruiter/my` | `my`、`referrals`，其余入口仍在逐步收口 |

说明：

- `/[role]` 会自动重定向到对应的 `/[role]/my`
- 越权访问不会再改写到其他工作台，而是直接展示访问错误页
- 部分低频角色的业务页仍处于过渡或占位阶段，主线开发以 `administrator`、`salesman`、`client` 为主

## 目录结构

```text
baisheng-web/
├─ app/
│  ├─ (auth)/
│  └─ (workspace)/
├─ components/
│  ├─ auth/
│  └─ dashboard/
│     ├─ admin-orders/
│     ├─ admin-reviews/
│     ├─ admin-tasks/
│     ├─ commission/
│     ├─ dashboard-shared-my/
│     ├─ exchange-rates/
│     ├─ referrals/
│     ├─ salesman-tasks/
│     ├─ tasks/
│     ├─ team-management/
│     └─ ...共享壳层与通用 UI
├─ i18n/
├─ lib/
├─ messages/
├─ output/
│  └─ playwright/
├─ public/
├─ scripts/
├─ proxy.ts
└─ README.md
```

说明：

- `components/dashboard` 已按功能拆分；根目录只保留工作台壳层和共享 UI
- 超过 `1000` 行的大文件需要继续拆分，避免再积累结构债
- `output/playwright` 用于保留有价值的截图和报告，不存放长期无用的临时控制台垃圾

### `admin-orders` 模块分层（2026-04-22）

- `admin-orders-client.tsx`：仅负责页面编排、翻译文案接线和主要组件组合
- `use-admin-orders-view-model.ts`：只负责拼装派生数据与组合子 hook，不再直接堆积所有 CRUD 逻辑
- `use-admin-orders-route-state.ts`、`use-admin-order-selection.ts`、`use-admin-order-create-dialog.ts`、`use-admin-order-edit-dialog.ts`、`use-admin-order-delete-actions.ts`：分别承接路由筛选、选中订单、创建、编辑和删除流程
- `admin-orders-client-config.ts`：放置 orders 视图配置、过滤器比较和表单字段联动规则
- `admin-orders-copy.ts`、`admin-orders-display.ts`、`admin-orders-form.ts`、`admin-orders-details.ts`、`admin-orders-errors.ts`、`admin-orders-permissions.ts`：分别承接文案映射、显示格式化、表单解析、详情展开、错误映射和权限判断
- `admin-orders-form-dialog.tsx`、`admin-orders-details-dialog.tsx`、`admin-orders-dialog-ui.tsx`：拆出订单表单弹窗、详情弹窗以及弹窗共享 UI
- `admin-orders-utils.ts`：只保留 barrel re-export，不再承载实际业务实现

### `admin-tasks` 模块分层（2026-04-23）

- `admin-tasks-client.tsx`：只负责工作台编排，不再直接承载筛选、分页、创建、编辑、分配和删除逻辑
- `use-admin-tasks-view-model.ts`：聚合任务页的路由状态、创建/编辑弹窗、分配弹窗和删除动作
- `use-admin-tasks-route-state.ts`、`use-admin-task-create-dialog.ts`、`use-admin-task-edit-dialog.ts`、`use-admin-task-assignment-dialog.ts`、`use-admin-task-delete-action.ts`：分别承接路由筛选与分页、创建任务、编辑任务、任务分配和删除流程
- `admin-tasks-sections.tsx`：拆出头部指标、筛选区、列表区和无权限态
- `admin-task-form-dialog.tsx`：集中承接任务创建/编辑表单弹窗，避免把字段表单继续堆进 client 或 assignment dialog
- `admin-task-form-sections.tsx`：拆出任务表单摘要卡、核心字段区和附件区，控制单文件长度并保持弹窗壳层纯粹
- `admin-tasks-dialogs.tsx`：只保留任务分配弹窗
- `admin-tasks-view-model-shared.ts`：集中放置任务页共享类型、筛选比较和输入样式常量
- 任务操作权限已拆成“编辑 / 删除 / 调整归属”三类：已完成任务仅管理员可编辑/删除，任务开始后禁止再改归属；默认任务板只展示未完成任务，已完成任务统一收进“历史已完成任务”视图
- 删除历史任务时会先读取关联的提审附件清单，再在任务删除后同步清理 `task-attachments` 和 `task-review-submissions` 两个存储桶中的对象，避免数据库级联删除后留下提审附件孤儿文件
- 任务状态目前覆盖 `to_be_accepted -> accepted -> reviewing -> rejected/completed`，其中管理员发布附件仍记录在 `task_sub`，执行人提交审核成果则单独进入 `task_review_submissions` / `task_review_submission_assets`
- 任务主表同时写入 `task_type_code` 与 `commission_amount_rmb`，当前内置 `video_shoot` 类型，后续可以继续扩展更多任务类型
- 任务审核通过后会同步写入 `task_commission_record`，任务佣金与订单佣金并行展示，但不复用订单佣金表结构

### `salesman-tasks` 模块分层（2026-04-22）

- `salesman-tasks-client.tsx`：只负责任务中心编排、指标展示和组件组装
- `use-salesman-tasks-page.ts`：负责路由筛选、分页、接取任务、上传成果、提交审核和附件打开动作
- `salesman-tasks-ui.tsx`：只保留任务卡片、搜索框和筛选器展示
- `salesman-task-submit-dialog.tsx`：单独承接“提交审核 / 重新提交审核”弹窗与文件选择流程

### `admin-reviews` 模块分层（2026-04-22）

- `admin-reviews-client.tsx`：只负责审核工作台编排、tab 切换和组件组装
- `use-admin-reviews-page.ts`：负责隐私审核、媒体审核、任务审核和提审附件打开动作
- `admin-reviews-ui.tsx`：保留隐私/媒体审核列表、媒体预览弹窗和共享摘要卡
- `task-review-list.tsx`：单独承接任务审核列表，避免把任务提审展示继续堆进现有审核 UI 文件

### `commission` 模块分层（2026-04-23）

- `admin-commission-client.tsx`：只负责佣金页编排、筛选状态、数据刷新和普通佣金 / 任务佣金板块切换，不再直接承载筛选区、受益人汇总区和佣金表格渲染
- `admin-commission-filters-section.tsx`、`admin-commission-record-sections.tsx`：继续把筛选区、受益人汇总区和普通佣金明细表拆开，控制单文件长度并避免把待结算操作继续堆进 page/client 组件
- `admin-commission-view-model.ts`：集中放置筛选类型、受益人汇总类型和普通佣金受益人聚合逻辑
- `admin-commission-sections.tsx`：只保留佣金 section/barrel re-export，避免再把真实实现回堆进同一个文件
- `use-managed-commission-settlement.ts`：集中承接普通佣金与任务佣金的“标记已结算”流程、确认提示和页面反馈
- `salesman-commission-client.tsx`：负责个人佣金页编排与权限态切换
- `commission-board-switch.tsx`：统一承接“普通佣金 / 任务佣金”两个小板切换，避免把板块切换逻辑分散到多个页面
- `admin-task-commission-section.tsx`、`salesman-task-commission-section.tsx`：拆出任务佣金展示区，其中管理员 / 财务侧额外承接待结算任务佣金的手动结算按钮
- `lib/commission-settlement.ts`：集中处理订单佣金与任务佣金的手动结算 RPC 调用
- `lib/task-commissions.ts`：集中处理任务佣金查询、任务类型名称、团队名称和受益人映射

### `team-management` 模块分层（2026-04-22）

- `team-management-client.tsx`：只负责页面编排和条件渲染
- `use-team-management-view-model.ts`：只负责组装派生状态、搜索输入和草稿输入，不再直接堆积所有副作用
- `use-team-management-actions.ts`、`team-management-view-model-shared.ts`：分别承接团队 CRUD/刷新动作，以及团队页共享状态结构与数据快照转换
- `team-management-state-sections.tsx`、`team-management-summary-sections.tsx`、`team-management-roster-sections.tsx`：分别承接页头与空态、概览与详情、成员/候选/客户区块
- `team-management-sections.tsx`：只保留 barrel re-export
- `team-management-ui.tsx`：保留卡片、搜索框、标签和小型展示组件
- `team-management-display.ts`、`team-management-utils.ts`、`team-management-section-styles.ts`：继续负责文案映射、搜索过滤和共享输入样式，不再混入页面状态

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 复制环境变量

```bash
Copy-Item .env.example .env.local
```

3. 启动开发环境

```bash
npm run dev
```

默认访问地址：

- `http://localhost:3000`
- `http://localhost:3000/login`
- `http://localhost:3000/register`
- `http://localhost:3000/forgot-password`

## 环境变量

至少需要以下配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

说明：

- `NEXT_PUBLIC_*` 用于浏览器端和 SSR 访问 Supabase
- `SUPABASE_SERVICE_ROLE_KEY` 只允许服务端脚本或受控管理任务使用，不能暴露到前端
- `.env.local` 不应提交到仓库

## 常用命令

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run clean:artifacts
npm run clean:cache
npm run clean:all
npm run supabase:admin -- summary
```

说明：

- `npm run clean:artifacts`：清理 `.playwright-cli` 和 `output/playwright` 下的临时日志、临时会话目录，并整理截图/报告
- `npm run clean:cache`：清理 `.next` 和 `tsconfig.tsbuildinfo`
- `npm run clean:all`：同时执行产物清理和缓存清理
- `npm run supabase:admin -- summary`：查看订单、汇率等表的概览

## 构建与本地产物

仓库已经忽略以下本地产物：

- `.next/`
- `.playwright-cli/`
- `output/`
- `node_modules/`
- `*.tsbuildinfo`

推荐约定：

- `.next` 视为可再生缓存，只有在磁盘压力大或怀疑缓存脏时才清
- `.playwright-cli` 视为临时产物，应定期清理
- `output/playwright/reports` 用于保留结构化报告
- `output/playwright/screenshots` 用于保留需要留档的截图

## 测试与验证要求

Web 项目改动后，必须在真实浏览器环境中进行验证。

- 使用 Playwright 在真实浏览器环境中验证改动页面
- 使用测试账号执行登录、跳转、权限验证
- 至少确认改动页面的主要按钮可点击、登录后的角色跳转正确、越权访问会被纠正
- 测试账号文件：`D:\code\code-project\测试账号.txt`

说明：

- 如果这次只改文档，没有页面逻辑变化，也建议至少做一次最小 smoke，确认登录和权限链路未被意外影响
- 真实数据的新增、删除、提交类动作默认只验证到入口或弹窗，避免污染线上或共享数据

## 部署说明

建议部署参数：

- Framework: `Next.js`
- Build Command: `npm run build`
- Start Command: `npm run start`
- Output Directory: `.next`

Supabase Auth 建议配置：

- Site URL：线上站点根地址
- Redirect URLs：线上根地址、`/forgot-password`，以及本地开发地址 `http://localhost:3000`、`http://localhost:3000/forgot-password`

## 相关文档

- [web项目说明及推送流程.md](D:/code/code-project/web项目说明及推送流程.md)
- [SUPABASE操作指南.md](D:/code/code-project/SUPABASE操作指南.md)
