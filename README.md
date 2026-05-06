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

- `app/(auth)`：公开页与认证页，包含 `/`、`/login`、`/register`、`/forgot-password`、`/privacy`、`/terms`、`/help`
- `app/(workspace)/[workspace]/home`：各角色登录后的默认首页，展示北京时间问候和当前角色可见公告
- `app/(workspace)/[workspace]/my`：各角色共享“我的”个人资料页面入口
- `app/(workspace)/[workspace]/[section]`：按角色动态装配公告管理、订单、推荐树、团队、人员管理、佣金、任务、审核、反馈管理等页面；管理员汇率设置整合在订单页内
- `app/forbidden.tsx`：统一承接越权访问时的访问错误页
- `proxy.ts`：会话同步、登录保护、工作台访问前置校验
- `lib/workspace-config.ts`：角色导航、页面变体和工作台配置中心
- `lib/auth-routing.ts`：角色与工作台 base path 的映射

## 角色与入口

当前工作台基于以下角色 base path：

| 角色 | 默认入口 | 当前重点模块 |
| --- | --- | --- |
| `administrator` | `/admin/home` | `home`、`announcements`、`orders`（含汇率设置）、`referrals`、`team`、`people`、`commission`、`tasks`、`reviews`、`feedback` |
| `salesman` | `/salesman/home` | `home`、`orders`、`referrals`、`team`、`commission`、`exchange-rates`、`tasks` |
| `client` | `/client/home` | `home`、`orders`、`referrals` |
| `manager` | `/manager/home` | `home`、`referrals`、`team` |
| `operator` | `/operator/home` | `home`、`referrals`、`team` |
| `finance` | `/finance/home` | `home`、`referrals`、`team`、`commission` |
| `recruiter` | `/recruiter/home` | `home`、`referrals` |

说明：

- `/[role]` 会自动重定向到对应的 `/[role]/home`
- 越权访问不会再改写到其他工作台，而是直接展示访问错误页
- 角色导航只展示当前已启用模块；已知但未授权的同工作台模块会展示访问错误页，而不是继续显示占位入口

## 目录结构

```text
baisheng-web/
├─ app/
│  ├─ (auth)/
│  └─ (workspace)/
├─ components/
│  ├─ auth/
│  ├─ brand/
│  ├─ legal/
│  └─ dashboard/
│     ├─ admin-people/
│     ├─ admin-feedback/
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
│     ├─ workspace-feedback/
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
- `components/dashboard/workspace-feedback` 承接所有登录用户的顶部反馈弹窗；`components/dashboard/admin-feedback` 承接管理员反馈列表、筛选和状态调整
- `components/dashboard/ai-assistant` 承接登录后右下角柏盛助手浮窗、打开/关闭动效、聊天状态、流式消息展示和“新对话”二次确认；`AdminShell` 只负责挂载入口，不承载助手对话逻辑
- `lib/ai-assistant` 承接柏盛管理系统助手提示词、请求类型和 DeepSeek 服务端流式调用；第一版只做工作台问答引导，不读取或改动订单、人员、任务等业务数据
- `components/dashboard/dashboard-section-header.tsx` 统一承接各业务板块页头；新增订单、任务、团队、佣金、汇率、审核、公告、推荐树等板块时，优先复用它传入标题、说明、指标和操作按钮，避免在业务 Client/Page 中重复堆页头布局
- `components/dashboard/dashboard-section-panel.tsx` 统一承接筛选面板、列表面板、列表标题和表格外框；新增带筛选或清单的板块时，优先复用它保持间距、边框、阴影和响应式结构一致
- `components/dashboard/dashboard-segmented-tabs.tsx` 统一承接板块内切换按钮；订单页“订单列表 / 汇率设置”、佣金页“普通佣金 / 任务佣金”和审核页多队列切换都应复用这一套视觉样式
- `components/dashboard/dashboard-pill.tsx` 与 `components/dashboard/tasks/task-ui.tsx` 分别统一承接工作台标签、任务状态/范围标签、任务搜索筛选和信息块；任务相关板块不要在各自 UI 文件里再复制一套 pill、tile 或筛选控件
- 工作台共享页头、指标卡、筛选面板、列表面板、移动导航和分页控件都需要保留小屏紧凑样式；新增板块不要只按桌面端密度堆叠信息
- `components/brand/brand-mark.tsx` 统一承接公司 Logo 展示；当前 Logo 源文件为 `public/images/pt5-logo.png`，浏览器图标由 `app/favicon.ico`、`app/icon.png` 和 `app/apple-icon.png` 承接；认证页和工作区样式入口都需要继续 `@source "../components/brand"`
- `components/legal` 承接公开法律页和隐私/条款页脚链接，避免把 legal 展示继续堆进认证或“我的”核心文件
- `lib/auth-metadata.ts`、`lib/value-normalizers.ts` 与 `lib/task-attachment-policy.ts` 分别承接角色/状态标准化、基础字符串/数字归一化、任务附件和提审附件的上传策略；新增查询、筛选或上传流程时优先复用这些 helper
- 单文件超过 `400-600` 行，或出现 3 个以上独立职责时，需要优先拆成 `queries`、`mutations`、`view-model hook`、`dialog`、`section/table` 或 `display-utils`
- `output/playwright` 用于保留有价值的截图和报告，不存放长期无用的临时控制台垃圾

## 公开法律页面（2026-04-24）

- 新增 `/privacy` 隐私政策页、`/terms` 服务条款页与 `/help` 帮助中心页，位于 `app/(auth)/privacy`、`app/(auth)/terms` 和 `app/(auth)/help`
- 页面导航与返回文案仍使用 `messages/zh.json`、`messages/en.json` 下的 `Legal` 命名空间；正式法律正文集中维护在 `lib/legal-formal-content.ts`
- 登录/注册页底部、注册勾选说明，以及各角色“我的”页页脚已接入真实隐私政策、服务条款和帮助中心链接
- 正文已改为更正式的公开法律文本，覆盖隐私政策中的信息处理主体、敏感个人信息、共享披露、保存安全和用户权利，以及服务条款中的账号权限、用户行为、提交审核、知识产权、责任限制和争议解决
- 最近验证：`npm run lint`、`npx tsc --noEmit`、`npm run build` 通过；Playwright 已覆盖未登录访问、注册/登录页链接、中英切换，以及管理员登录后“我的”页页脚链接

## 认证页体验优化（2026-04-29）

- 登录、注册和找回密码页面继续共用 `AuthShell`，页面文件只负责组装文案、外壳和对应表单。
- 注册表单不再做客户端二次登录态等待；已登录用户仍由服务端认证页入口提前跳转，未登录用户可以更快看到注册表单。
- 密码输入统一由 `components/auth/auth-password-field.tsx` 承接显示/隐藏按钮和字段样式，密码规则由 `components/auth/auth-password-policy.ts` 复用，避免登录、注册和重置密码表单重复维护。
- 注册和重置密码会提示基础密码规则，并在提交前阻止不符合规则的密码；认证页宣传文案改为账号安全、角色工作台和业务协作相关表达。
- 2026-04-30 补充：找回密码邮件发送成功后会明确显示收件邮箱，并提示检查垃圾邮件或联系管理员确认账号邮箱；认证页桌面侧图不再强制优先加载，降低移动端首屏资源压力。
- 2026-04-30 补充：认证页底部的登录/注册跳转会提前预取目标页面，并在点击后立刻显示轻量加载反馈；注册页服务端会话检查与文案加载改为并行等待，减少从登录页切换到注册页时的停顿感。
- 2026-05-06 补充：登录页 PageSpeed 优化去掉全站中文 WebFont 下载，改用系统中文字体；登录桌面侧图使用更高请求优先级但不做移动端预加载，品牌 Logo 交给 Next 图片优化按实际尺寸输出。

## 首页与公告（2026-04-27）

- 所有角色登录后的默认入口调整为 `/{role}/home`，首页展示北京时间分段问候和当前账号可见的最新公告
- 公告数据由 `public.announcements` 承接，发布对象分为 `client`、`internal`、`all`；其中 `internal` 包含管理员、运营、经理、招聘员、业务员和财务等非客户角色
- 管理员侧新增 `/admin/announcements`，支持创建草稿、编辑、发布、下线和删除公告；其他角色只在首页读取已发布且命中发布对象的公告
- 前端分层保持独立：`lib/announcements.ts` 负责公告查询和 mutation，`lib/dashboard-home.ts` 负责首页轻量数据，`components/dashboard/dashboard-home/*` 与 `components/dashboard/announcements/*` 分别承接首页和公告管理 UI
- 2026-04-28 补充：工作区顶部公告按钮的最近公告和未读状态由 `components/dashboard/admin-shell.tsx` 在服务端准备初始数据，再交给 `workspace-header-actions` 渲染；客户端 hook 只负责刷新、已读和弹窗交互，避免首屏再等待浏览器端补取公告状态
- 2026-05-06 补充：登录页公开公告读取使用 60 秒服务端缓存，并通过公开匿名客户端读取，避免未登录首屏反复等待同一条公告查询。
- 本次没有把公告逻辑塞进已经超过 600 行的 `user-self-service.ts` 或 `dashboard-shared-my` 页面文件

## 界面文案约束（2026-04-27）

- `messages/zh.json` 和 `messages/en.json` 中的用户可见文案禁止暴露数据库表名、字段名、主键、同步请求、云端登录态等实现细节，应改为面向业务结果的表达
- `components/dashboard/dashboard-shared-ui.tsx` 作为共享错误提示入口，需要把明显的数据库、存储、网络和服务端技术错误收敛成通用可读提示；具体模块如订单、任务、团队、汇率可再基于原始错误补充更细的业务映射
- 2026-04-27 补充：国际化文案不仅要避开数据库和接口词，还要继续清理 `JSON`、`task_sub`、`task-attachments`、`salesman` 角色码、`active` 状态码、`快照同步` 等工程术语，统一改成用户能直接理解的日常表达
- 2026-04-28 补充：语言切换、登录跳转等会引起页面刷新或路由跳转的操作，点击后必须立即展示等待状态，并在切换或跳转完成前禁止重复点击

## 上传限制（2026-04-24）

- Web 端上传尺寸已统一收紧：个人照片、任务附件、提审附件中的图片需小于 `5 MB`，视频需小于 `30 MB`，其余文件维持 `20 MB` 单文件上限，总体积限制仍按各模块原有规则执行
- `lib/task-attachment-policy.ts` 是任务发布附件和任务提审附件的共同来源，统一维护允许类型、体积校验、存储路径和失败清理；前端提示、任务发布和审核提交流程需要保持一致，不要再分别复制一份上传规则

### `dashboard-shared-my` 模块分层（2026-04-27）

- `dashboard-shared-my-client.tsx`：只保留“我的”页主结构编排、资料卡片区、媒体入口卡片、隐藏上传输入和弹窗挂载点，当前已控制在 400 行以内
- `dashboard-shared-my-copy.ts`：集中承接 `DashboardMy` 翻译文案映射，避免在 client 组件里堆积大段 copy 对象
- `dashboard-shared-my-dialogs.tsx`：单独承接身份证/护照/照片/视频弹窗和城市编辑弹窗，避免把多种弹窗状态和渲染细节继续塞回页面主体
- `dashboard-shared-my-state-copy.ts`、`dashboard-shared-my-view-model.tsx`：分别承接“我的”页状态文案和资料/媒体展示派生值，让状态 hook 不再同时处理 copy 映射和视图模型组装
- `use-dashboard-shared-my-state.tsx`：保留资料同步、账号动作、媒体动作和弹窗状态调度，当前已收敛到 600 行以内；后续若继续增加证件表单或媒体动作，应优先拆成更细的 action hooks

### `admin-orders` 模块分层（2026-04-22）

- `admin-orders-client.tsx`：仅负责页面编排、翻译文案接线和主要组件组合
- `use-admin-orders-view-model.ts`：只负责拼装派生数据与组合子 hook，不再直接堆积所有 CRUD 逻辑
- `use-admin-orders-route-state.ts`、`use-admin-order-selection.ts`、`use-admin-order-create-dialog.ts`、`use-admin-order-edit-dialog.ts`、`use-admin-order-delete-actions.ts`：分别承接路由筛选、选中订单、创建、编辑和删除流程
- `admin-orders-client-config.ts`：放置 orders 视图配置、过滤器比较和表单字段联动规则
- `admin-orders-copy.ts`、`admin-orders-display.ts`、`admin-orders-form.ts`、`admin-orders-details.ts`、`admin-orders-errors.ts`、`admin-orders-permissions.ts`：分别承接文案映射、显示格式化、表单解析、详情展开、错误映射和权限判断
- `admin-orders-form-dialog.tsx`、`admin-orders-details-dialog.tsx`、`admin-orders-dialog-ui.tsx`：拆出订单表单弹窗、详情弹窗以及弹窗共享 UI
- 2026-04-28 补充：订单采购/服务补充明细改为通过“创建类别”添加双输入行，左侧填写类别名称，右侧填写对应内容，不再要求用户手写“项目: 内容”格式
- 2026-05-06 补充：管理员汇率设置整合到 `/admin/orders?tab=exchange-rates`，左侧导航不再单独展示管理员汇率入口；旧 `/admin/exchange-rates` 会跳转到订单页的汇率设置标签
- 2026-05-06 补充：新建订单默认使用 `USD -> CNY`，当日汇率自动填入且不能手动修改；缺少当日汇率时会阻止创建订单，已创建订单编辑时币种、当日汇率和公司成交汇率保持原值
- 2026-05-06 补充：订单页内“订单列表 / 汇率设置”切换使用本地即时反馈，点击后先切换页面内容并显示加载状态，再同步地址栏参数，避免用户感觉按钮没有响应
- `admin-orders-utils.ts`：只保留 barrel re-export，不再承载实际业务实现

### 自动汇率与订单规则（2026-05-06）

- 汇率同步配置由 Supabase 的 `exchange_rate_sync_settings` 和 `exchange_rate_sync_pairs` 承接，默认每天获取 `USD -> CNY`；管理员可以在订单页的“汇率设置”标签中开关自动获取、增删每天获取的币种，并一次手动获取多个币种
- 自动获取由 Supabase `pg_cron` 每天 UTC `01:30` 调用 `exchange-rate-sync` Edge Function，对应北京时间 `09:30`
- `exchange-rate-sync` 使用 ExchangeRate-API Standard endpoint，从 `{base}` 读取 `conversion_rates.CNY`；API key 只通过 Supabase secret `EXCHANGE_RATE_API_KEY` 配置，不进入前端代码和仓库
- 管理员手动获取会先校验当前登录令牌中的管理员身份，再由 Edge Function 使用服务端 secret 请求汇率接口，前端不会接触真实 API key
- 订单保存 RPC 会在数据库端重新按当天 `原币 -> CNY` 取汇率，忽略前端传入的汇率字段；`rmb_amount` 仍按现有业务方式录入，不自动计算
- 本次拆分新增 `exchange-rate-sync-section.tsx` 和 `use-exchange-rate-sync-settings.ts` 承接汇率设置 UI 与动作，订单页只负责标签组合，避免把自动汇率状态继续堆进订单或汇率核心 Client 文件

### `admin-tasks` 模块分层（2026-04-23）

- `admin-tasks-client.tsx`：只负责工作台编排，不再直接承载筛选、分页、创建、编辑、分配和删除逻辑
- `use-admin-tasks-view-model.ts`：聚合任务页的路由状态、创建/编辑弹窗、分配弹窗和删除动作
- `use-admin-tasks-route-state.ts`、`use-admin-task-create-dialog.ts`、`use-admin-task-edit-dialog.ts`、`use-admin-task-assignment-dialog.ts`、`use-admin-task-delete-action.ts`：分别承接路由筛选与分页、创建任务、编辑任务、任务分配和删除流程
- `admin-tasks-sections.tsx`：拆出头部指标、筛选区、列表区和无权限态
- `admin-task-form-dialog.tsx`：集中承接任务创建/编辑表单弹窗，避免把字段表单继续堆进 client 或 assignment dialog
- `admin-task-form-sections.tsx`：拆出任务表单摘要卡、核心字段区和附件区，控制单文件长度并保持弹窗壳层纯粹
- `admin-tasks-dialogs.tsx`：只保留任务分配弹窗
- `admin-tasks-view-model-shared.ts`：集中放置任务页共享类型、筛选比较和输入样式常量
- `lib/admin-tasks.ts`：保留管理员任务页查询、创建、编辑、改派、删除和页面数据编排，当前已控制在 600 行以内
- `admin-tasks-ui.tsx` 只保留管理员任务卡片和表单字段壳层；状态/范围标签、搜索/筛选和信息块统一复用 `components/dashboard/tasks/task-ui.tsx`
- `lib/admin-tasks-types.ts`、`lib/admin-task-normalizers.ts`、`lib/admin-task-attachments.ts`：分别承接任务类型定义、数据库行归一化、附件上传/读取，通用上传校验和存储清理由 `lib/task-attachment-policy.ts` 统一承接
- `admin-task-submission-media.tsx`、`use-admin-task-submission-media.ts`：单独承接历史已完成任务中的成员图片/视频成果读取、预览弹窗和下载动作
- `lib/admin-task-submission-media.ts`：集中查询已完成任务的审核通过成果媒体，并为私有存储对象生成短期 signed URL
- 管理员任务板头部指标只保留“进行中 / 审核中”两项，并移除状态筛选栏；任务卡片不再展示归属锁定说明文案
- 任务操作权限已拆成“编辑 / 删除 / 调整归属”三类：已完成任务仅管理员可编辑/删除，任务开始后禁止再改归属；默认任务板只展示未完成任务，已完成任务统一收进“历史已完成任务”视图
- 管理员在“历史已完成任务”视图中可直接查看业务员已通过审核的图片/视频成果，并按单个文件预览或下载原文件
- 删除历史任务时会先读取关联的提审附件清单，再在任务删除后同步清理 `task-attachments` 和 `task-review-submissions` 两个存储桶中的对象，避免数据库级联删除后留下提审附件孤儿文件
- 任务状态目前覆盖 `to_be_accepted -> accepted -> reviewing -> rejected/completed`，其中管理员发布附件仍记录在 `task_sub`，执行人提交审核成果则单独进入 `task_review_submissions` / `task_review_submission_assets`
- 任务主表同时写入 `task_type_code` 与 `commission_amount_rmb`，当前内置 `video_shoot` 类型，后续可以继续扩展更多任务类型
- 任务审核通过后会同步写入 `task_commission_record`，任务佣金与订单佣金并行展示，但不复用订单佣金表结构

### `salesman-tasks` 模块分层（2026-04-22）

- `salesman-tasks-client.tsx`：只负责任务中心编排、指标展示和组件组装
- `use-salesman-tasks-page.ts`：负责路由筛选、分页、接取任务、上传成果、提交审核和附件打开动作
- `salesman-tasks-ui.tsx`：只保留业务员任务卡片展示；搜索/筛选、状态/范围标签和信息块统一复用 `components/dashboard/tasks/task-ui.tsx`
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
- `team-management-ui.tsx`：保留团队专属卡片和小型展示组件；页头、指标卡、搜索框和标签改为复用工作台共享组件
- `team-management-state-sections.tsx` 与 `team-management-summary-sections.tsx` 的状态区、概览区和详情区已接入 `DashboardListSection` / `DashboardSectionPanel`，避免团队页继续维护一套不同的面板壳层
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
EXCHANGE_RATE_API_KEY=your-exchangerate-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

说明：

- `NEXT_PUBLIC_*` 用于浏览器端和 SSR 访问 Supabase
- `SUPABASE_SERVICE_ROLE_KEY` 只允许服务端脚本或受控管理任务使用，不能暴露到前端
- `EXCHANGE_RATE_API_KEY` 只配置为 Supabase Edge Function secret，用于自动和手动获取当日汇率
- `DEEPSEEK_API_KEY` 只在 Next.js 服务端接口中使用，用于登录后右下角的柏盛助手
- `DEEPSEEK_BASE_URL` 和 `DEEPSEEK_MODEL` 用于切换 DeepSeek 接入地址和模型，默认使用 `https://api.deepseek.com` 与 `deepseek-v4-flash`
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

## 工作区账号菜单与个人中心拆分

- 右上角头像不再直接跳转页面，改为账号下拉菜单。
- 账号菜单入口对应个人中心、账号中心、个人资料、账号与认证，并保留退出登录操作。
- /{角色}/my 继续作为个人中心页面，页面内部按个人中心、账号中心、个人资料、账号与认证四个分区组织。
- 页面分区渲染拆到 `components/dashboard/dashboard-shared-my/dashboard-shared-my-sections.tsx`，头像菜单继续放在工作区头部控件内。
- 2026-04-29 补充：个人中心内部分区入口保持贴在工作区页头下方，避免从帮助中心等公开页面回退时因浏览器恢复滚动位置而看不到分区按钮。
- 2026-04-29 补充：个人资料编辑说明只保留可更新字段说明，不再展示管理员与其他账号的保存差异提示。

## 工作区入口、公告与资料修改审批

- 左侧工作区导航不再展示“我的”，但 /{角色}/my 页面继续保留；用户通过右上角头像进入自己的资料页。
- 公告已读按账号记录。用户登录后若有未读公告，会自动弹窗提示；右上角公告按钮展示当前账号最近 5 条可查看公告。
- 登录页展示最新一条已发布的全员公告，通过公开 RPC 读取单条内容，不开放匿名整表读取。
- 2026-04-29 补充：登录页公告改为独立异步区块，登录表单和基础页面不再等待公告读取完成；登录成功后的跳转优先读取本次会话里的角色信息，避免重复等待角色判断。
- 退出登录改为当前浏览器快速退出：点击后立即清除本地会话并返回登录页，不再等待云端会话请求完成；该动作只保证当前浏览器退出。
- 姓名和城市统一走资料修改规则：管理员修改自己的资料立即生效，其他角色提交后进入管理员审核。
- 审核中心新增“资料修改”队列，和隐私、媒体、任务审核并列处理。
- 本次新增公告读取、公开公告、资料修改申请和资料弹窗 hook 等独立模块，避免继续扩大自助资料页和工作区布局核心文件。

## 问题反馈与改进建议（2026-05-06）

- 所有正常登录用户可以从工作区顶部“反馈”按钮提交问题反馈或改进建议；第一版只收集文字说明，不上传截图或附件，也不展示用户历史。
- 反馈数据由 Supabase `workspace_feedback` 承接，普通用户通过受控提交函数写入，管理员通过 `/admin/feedback` 查看并调整处理状态。
- 管理员反馈页支持搜索、类型筛选、状态筛选和状态切换；其他角色不会显示左侧反馈管理入口，直接访问也会进入当前访问错误页。
- 前端分层保持拆分：`lib/workspace-feedback.ts` 承接查询与状态更新，`components/dashboard/workspace-feedback/` 承接全局提交弹窗，`components/dashboard/admin-feedback/` 承接管理员列表、筛选和显示工具。
- 最近验证：`npm run lint`、`npx tsc --noEmit`、`npm run build` 通过；`20260506113000_add_workspace_feedback.sql` 已推送到 Supabase 远端；Playwright 覆盖业务员提交反馈、管理员查看并改为“处理中”、业务员直接访问 `/admin/feedback` 显示访问错误页。

## 人员管理（2026-04-28）

- 管理员工作台新增 `/admin/people` 人员管理板块，左侧导航显示“人员管理”，仅正常启用的管理员账号可访问。
- 人员管理只负责账号身份和账号状态调整；推荐树继续负责关系来源，团队管理继续负责团队归属，佣金等业务记录不会被自动改动。
- 调整账号时，服务端会同时更新 Supabase Auth `app_metadata.role/status` 和业务表镜像，并写入管理员调整记录；浏览器端不会接触服务端凭据。
- 为避免误锁账号，系统禁止管理员在该板块调整自己的身份或状态，并禁止停用或降级最后一个正常启用的管理员账号。
- 角色和状态变化会在目标账号下次登录或刷新登录状态后完全生效，页面会在调整弹窗中提示这一点。
- 前端新增 `components/dashboard/admin-people/`，按 client、view-model、sections、dialog、display 拆分；后端读取和 mutation 分别放在 `lib/admin-people.ts` 与 `lib/admin-people-mutations.ts`。

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
