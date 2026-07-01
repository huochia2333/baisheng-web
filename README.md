# 柏盛管理系统 Web 前端

柏盛管理系统 Web 端基于 `Next.js 16 App Router`、`React 19`、`TypeScript`、`Tailwind CSS 4`、`Supabase` 和 `next-intl` 构建。

项目目录：`D:\code\code-project\baisheng-web`

## 快速定位

- Web 仓库：`D:\code\code-project\baisheng-web`
- Supabase 目录：`D:\code\code-project\supabase`
- 测试账号：`D:\code\code-project\测试账号.txt`
- Web 推送说明：`D:\code\code-project\web项目说明及推送流程.md`
- Supabase 操作说明：`D:\code\code-project\SUPABASE操作指南.md`

说明：

- `D:\code\code-project` 只是工作区容器，不是 Web Git 仓库。
- Web 代码提交和推送只在 `baisheng-web` 目录执行。
- 数据库迁移、Edge Function 和 Supabase secrets 以同级 `supabase` 目录为准。

## 技术栈

- `Next.js 16.2.9` + App Router
- `React 19.2.4`
- `TypeScript 5`
- `Tailwind CSS 4`
- `Supabase Auth` / `@supabase/ssr` / `@supabase/supabase-js`
- `next-intl` 中英文双语
- `Playwright` 真实浏览器验证
- `lucide-react` 图标
- `Base UI` / `shadcn` 辅助组件

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 准备环境变量

```powershell
Copy-Item .env.example .env.local
```

3. 启动开发服务

```bash
npm run dev
```

默认入口：

- `http://localhost:3000`
- `http://localhost:3000/login`
- `http://localhost:3000/register`
- `http://localhost:3000/forgot-password`

开发约束：

- 同一个 Next 项目目录不要同时启动两个 dev server。
- Playwright 或本地验证建议固定使用 `http://localhost:3000`，避免热更新资源来源不一致；`127.0.0.1` 已加入开发来源允许列表，但改动配置后需要重启 dev server 才生效。
- 如果 `3000` 已被其他项目占用，本项目临时运行在 `3001` 等端口，Playwright 验证必须显式指定当前端口，并跳过自动启动服务：

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://localhost:3001"
$env:PLAYWRIGHT_SKIP_WEB_SERVER = "1"
npm run test:e2e
```

- `.env.local`、真实密钥、测试账号和本地产物不能提交。

## 环境变量

至少需要：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SITE_URL=https://account.pt5china.com
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
EXCHANGE_RATE_API_KEY=your-exchangerate-api-key
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

说明：

- `NEXT_PUBLIC_*` 用于浏览器端和 SSR 访问 Supabase。
- `NEXT_PUBLIC_SITE_URL` 用于邮箱确认等服务端回跳地址，线上应与 Supabase Auth 的 Site URL 保持一致；未配置时只允许默认线上域名和本地开发域名。
- `SUPABASE_SERVICE_ROLE_KEY` 只允许服务端脚本或受控管理任务使用，不能暴露到前端。
- `EXCHANGE_RATE_API_KEY` 只配置为 Supabase Edge Function secret。
- `USER_MEDIA_IMAGE_REVIEW_PROVIDER` 和真实内容安全供应商密钥只配置为 Supabase Function secrets，默认 provider 为 `disabled`。
- `DEEPSEEK_API_KEY` 只在 Next.js 服务端接口中使用，用于登录后右下角的工作台助手；助手名称从 `lib/company-config.ts` 读取。
- `next.config.ts` 对所有页面和 API 返回基础浏览器安全头：不允许页面被嵌入其他网站，禁止浏览器猜测文件类型，限制来源信息和默认浏览器权限。

## 常用命令

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
npm run test:e2e
npm run test:e2e:ui
npm run test:regression
npm run clean:artifacts
npm run clean:cache
npm run clean:all
npm run supabase:admin -- summary
```

说明：

- `npm run test:regression` 会依次执行 lint、typecheck、build 和 Playwright 回归测试。
- `npm run clean:artifacts` 清理 `.playwright-cli` 和 `output/playwright` 下的临时验证产物。
- `npm run clean:cache` 清理 `.next` 和 `tsconfig.tsbuildinfo`。
- `npm run supabase:admin -- summary` 查看订单、汇率等表的概览。

## 角色与入口

当前系统使用统一动态工作台，不再为每个角色维护一套散落页面。登录、账号、角色、状态和个人中心共用同一套后台壳；业务入口在左侧导航中按“旅游业务”和“批发业务”分组展示。

| 角色 | 默认入口 | 当前模块 |
| --- | --- | --- |
| `administrator` | `/admin/home` | 全局首页、账号管理、公告管理、公司费用、反馈管理、汇率设置；旅游业务下的订单、客户管理、推荐树、团队、人员管理、VIP管理、操作记录、佣金、任务、审核和业务设置；批发业务下的批发订单、订单认领、物流、客户管理、人员管理、VIP管理、推荐树、佣金、提成和业务设置 |
| `salesman` | `/salesman/home` | 全局首页；固定仅可见批发业务，显示批发订单、订单认领、物流、客户管理、VIP管理、推荐树、佣金和提成 |
| `promoter` | `/promoter/home` | 全局首页；固定仅可见旅游业务，显示旅游订单、客户管理、VIP管理、推荐树、团队、佣金和任务 |
| `client` | `/client/home` | 全局首页；使用地推邀请码注册的客户默认进入旅游业务；使用业务员邀请码注册的客户默认进入批发业务；后续关联其他业务客户身份后可见对应业务的订单、物流、推荐树和佣金 |
| `manager` | `/manager/home` | 全局首页；旅游业务下的推荐树、团队、任务 |
| `operator` | `/operator/home` | 全局首页；旅游业务下的推荐树、团队、任务 |
| `finance` | `/finance/home` | 全局首页、公司费用；固定仅可见批发业务，显示批发订单、订单认领、物流、客户管理、VIP管理、推荐树、佣金和提成 |
| `recruiter` | `/recruiter/home` | 全局首页；旅游业务下的推荐树、任务 |

访问规则：

- `/[role]` 自动重定向到 `/[role]/home`。
- `/[role]/home` 和 `/[role]/my` 是全局页面，不归属于单个业务。
- `/admin/accounts`、`/admin/announcements`、`/admin/company-expenses` 和 `/admin/feedback` 是管理员全局管理页面，不归属于旅游业务或批发业务。
- `/finance/company-expenses` 是财务全局公司费用页面，不归属于旅游业务或批发业务。
- `/admin/settings` 是管理员全局汇率设置页面，不归属于旅游业务或批发业务。
- `/admin/tourism/settings` 是旅游业务设置，维护旅游订单服务费、服务价格、服务折扣和服务相关佣金。
- `/admin/wholesale/settings` 是批发业务设置，维护批发订单可直接修改天数、批发订单业务员提成和批发客户推荐佣金。
- `/[role]/tourism/[section]` 承载当前旅游业务页面。
- `/[role]/wholesale/[section]` 承载批发业务页面，使用独立批发模型，不复用旅游订单结构。
- 越权访问直接展示访问错误页，不改写到其他角色工作台；访问错误页提供“返回我的首页”和“重新登录”，方便浏览器保留了其他账号会话时直接换号。
- 左侧导航先按账号当前可见业务过滤，再展示当前角色在该业务下可用的模块。
- 桌面端左侧业务分组会在进入对应页面时自动展开，当前所在业务也可以通过分组按钮手动收起或再次展开；展开和收起带平滑过渡，移动端顶部菜单下拉也带淡入下拉动画。
- 当前阶段批发业务允许管理员、财务、业务员、以及拥有批发业务标记的客户访问；财务在批发业务中按业务员同类范围使用，不再访问旅游业务；地推、经理、运营、招聘员和只有旅游业务标记的客户只能访问旅游业务。
- 人员管理不再提供手动勾选“可见旅游业务 / 可见批发业务”的入口。客户的业务可见范围由注册推荐码、批发客户关联等业务流程开通。
- 每个账号只有一个邀请码。业务员的邀请码只服务批发客户注册，地推的邀请码只服务旅游客户注册；注册时系统按推荐人角色写入对应业务的推荐关系和客户可见业务。
- 已知但未授权的同工作台模块展示访问错误页，不再显示占位入口。
- 服务端权限判断必须先使用 Supabase 验证后的用户身份，再以数据库里的角色和状态作为放行依据；Auth 元数据只作为数据库上下文暂时不可读时的兜底。登录后的浏览器跳转也优先读取同一份数据库角色上下文，客户端会话只用于界面状态和会话同步，不能作为服务端放行依据。

## 路由结构

```text
app/
├─ (auth)/
│  ├─ login/
│  ├─ register/
│  ├─ forgot-password/
│  ├─ privacy/
│  ├─ terms/
│  └─ help/
├─ (workspace)/
│  └─ [workspace]/
│     ├─ announcements/
│     ├─ company-expenses/
│     ├─ feedback/
│     ├─ home/
│     ├─ my/
│     ├─ settings/
│     └─ [business]/
│        └─ [section]/
├─ error.tsx
├─ forbidden.tsx
└─ global-error.tsx
```

关键文件：

- `proxy.ts`：会话同步、登录保护、工作台访问前置校验。
- `lib/company-config.ts`：公司级配置，集中维护产品名、助手名、Logo、默认站点域名、支持邮箱和默认启用业务。
- `lib/workspace-business-modules.ts`：旅游业务和批发业务的模块清单，集中声明业务导航、角色页面能力、页面入口类型和业务设置区块。
- `lib/workspace-config.ts`：全局工作台配置中心，负责角色 base path、全局入口和从业务模块清单组装后的页面能力。
- `lib/workspace-route-segments.ts`：工作台角色路由段枚举。
- `lib/workspace-business-access.ts`：当前账号可见业务读取、业务键规范化和导航过滤辅助。
- `lib/auth-routing.ts`：角色与工作台 base path 映射。
- `components/auth/forbidden-session-actions.tsx`：访问错误页的返回首页和重新登录按钮，重新登录会清理当前浏览器会话后进入登录页。
- `lib/business-vip-management*.ts`：业务 VIP 的服务端边界；`queries` 读取旅游/批发 VIP 列表，`mutations` 调用旅游申请审批 RPC 和批发直接开通/续费 RPC，`normalizers` 统一整理 RPC 返回值，`errors` 把技术错误映射成页面提示。
- `lib/company-expenses.ts`：公司费用页面的数据读取、权限判断和增删改操作。
- `components/dashboard/company-expenses/`：公司费用页面的展示区块、表单弹窗、状态 hook 和显示工具。
- `components/dashboard/admin-shell.tsx`：工作台服务端壳层。
- `components/dashboard/admin-shell-client.tsx`：工作台登出等客户端动作。
- `components/dashboard/admin-shell-nav.tsx`：桌面和移动端分组导航。
- `components/dashboard/admin-shell-nav-types.ts`：工作台导航展示类型。
- `components/dashboard/use-admin-shell-navigation.ts`：工作台导航点击、预取和失焦恢复后的整页跳转兜底。
- `lib/request-timeout.ts`：登录后页面共享的 Supabase 读取超时为 30 秒，避免本地并发或云端短暂变慢时误进入错误页；确实耗时的上传、审核等操作在对应 mutation 中单独设置更长时间。
- `lib/use-stale-focus-recovery.ts`：页面长时间隐藏或窗口失焦后的跳转/刷新兜底判断。

## 目录约定

```text
baisheng-web/
├─ app/
├─ components/
│  ├─ auth/
│  ├─ brand/
│  ├─ dashboard/
│  └─ legal/
├─ i18n/
├─ lib/
├─ messages/
├─ public/
├─ scripts/
├─ tests/
├─ proxy.ts
└─ README.md
```

约定：

- `components/dashboard` 按业务模块拆分，根目录只保留壳层和共享 UI。
- 公司品牌、默认域名、Logo、助手名称和默认启用业务只能从 `lib/company-config.ts` 读取；不要在页面、组件、助手 prompt 或法律文案里重新写固定公司名。
- 旅游业务和批发业务的导航、角色页面能力、页面入口和业务设置区块由 `lib/workspace-business-modules.ts` 注册；新增、删除或裁剪业务时优先改业务模块清单，不在 `workspace-config.ts` 或页面入口里散落判断。
- `components/auth` 只放认证页表单、输入框和认证页跳转组件。
- `components/legal` 承接公开法律页和页脚链接。
- `lib` 承接服务端查询、mutation、显示格式化、错误映射和共享业务规则。
- `messages` 承接用户可见中英文文案。
- `output`、`.playwright-cli`、`.next` 和 `node_modules` 都是本地产物，不提交。

## 模块边界

工作台共享能力：

- `dashboard-section-header.tsx`：业务板块页头。
- `dashboard-section-panel.tsx`：筛选面板、列表面板和表格外框。
- `dashboard-segmented-tabs.tsx`：订单、任务、佣金、审核等板块内切换按钮。
- `dashboard-pill.tsx` 与 `components/dashboard/tasks/task-ui.tsx`：标签、任务状态、目标角色、搜索筛选和信息块。
- `workspace-header-actions.tsx`：顶部公告、反馈、语言切换和头像菜单入口。
- `workspace-feedback/`：所有登录用户的问题反馈弹窗和提交成功提示。
- `announcements/`：管理员全局公告管理列表、筛选、发布和下线，不挂在旅游业务或批发业务下。
- `dashboard-home/`：各角色首页组件化工作台；问候、当前时间、个人邀请码、公告和个人待办都作为可重复放置的首页组件呈现，编辑时用红色虚线框标出可放置区域；布局定义、布局状态 hook、组件卡片、侧栏和内容渲染拆在同层模块中；时钟刷新、邀请码复制、待办查询、保存状态、弹窗和展示继续拆分，不放进首页 Client/Page。
- `admin-feedback/`：管理员反馈管理列表、筛选和状态调整。
- `ai-assistant/`：右下角工作台助手浮窗、聊天状态、流式消息和反馈衔接；助手名称、产品名和反馈草稿标题从公司配置读取。
- `lib/account-switcher.ts`：本机常用账号会话切换，不保存密码，不写数据库。
- `business-vip/`：旅游业务和批发业务共用 VIP 入口但保持不同流程；旅游业务承接客户 VIP 申请、管理员确认收款或拒绝、充值记录、当前状态和有效期调整，批发业务显示精简客户列表、直接开通/续费按钮和独立操作记录表，点击批发客户可查看该客户全部开通和续费记录。批发 VIP 每次开通或续费都按 200 USD 年费记录，不产生业务员 VIP 佣金。Client 只负责筛选、弹窗状态和提交调度，列表、弹窗、展示格式和服务端查询/写入拆在同层或 `lib/business-vip-management*.ts`，底层数据仍按业务分开读取和写入。

主要业务模块：

- `admin-people/`：管理员全局账号管理，只处理登录账号、身份、状态、城市、备注和推荐码基础信息，配合 `lib/admin-people*.ts`。
- `tourism-people/`：旅游业务客户管理和人员管理的同层组件；客户管理单独查看旅游客户，人员管理只查看旅游业务人员，账号身份和状态调整回到全局账号管理，VIP 状态和申请不在这里处理。
- `admin-orders/`：旅游业务订单，配合订单查询、表单、详情、权限和错误映射模块；不承载新批发订单结构。
- `admin-system-settings/`：管理员全局汇率设置，只维护自动获取币种、手动补充汇率和历史记录。
- `business-settings/`：业务内设置页，旅游业务注册服务费、服务价格、服务折扣和服务相关佣金区块，批发业务注册批发订单修改规则、批发订单业务员提成和批发客户推荐佣金区块。
- `admin-tasks/`：管理员当前任务板、任务审核、任务媒体库、任务创建、编辑、详情、改派和删除。
- `salesman-tasks/`：内部成员任务接收、提交审核和成果附件。
- `admin-reviews/`：资料修改、隐私审核、媒体审核和智能初审展示；任务审核放在管理员任务板内切换。
- `commission/`：普通佣金、任务佣金和结算操作。
- `referrals/`：旅游业务推荐树和关系展示；批发业务推荐树由 `components/dashboard/wholesale/` 下的独立批发模块展示。
- `wholesale/`：批发业务模块，包含批发订单、结汇汇率确认和纠错、1688 订单认领、物流、客户管理、批发推荐树、客户推荐佣金和业务员提成；管理员额外可查看批发人员管理，不复用 `admin-orders/`；批发 VIP 使用独立客户权益模型，不复用旅游 VIP 表。
- 批发业务可以使用独立数据模型和页面模块，但页面视觉必须复用统一工作台的页头、面板、表格外框、筛选输入和空状态组件；`wholesale-ui.tsx` 只做轻量封装，不单独建立另一套卡片风格。
- `team-management/`：团队创建、成员维护、客户结构和团队详情。
- `dashboard-shared-my/`：个人中心、账号中心、资料、认证分区和“常用账号”入口。

拆分规则：

- `Client` / `Page` 组件只负责组装和调度。
- 查询、mutation、权限、表单状态、弹窗、表格渲染和文案映射不要继续堆在同一个核心文件里。
- 单文件超过 `400-600` 行，或出现 3 个以上独立职责时，优先拆成 `queries`、`mutations`、`view-model hook`、`dialog`、`section/table` 或 `display-utils`。
- 新增功能默认新建同层模块；只有极小改动才允许补进现有文件。
- Client/Page 入口只负责读取路由、权限和组装页面；业务差异优先放进业务模块清单、同层业务组件或 `lib` 查询/mutation/display-utils，不继续堆进页面入口。

## 当前关键业务规则

- 注册页只展示邀请码入口，不暴露业务类型选择；当前注册仍强制使用推荐码。地推邀请码进入旅游业务推荐关系，业务员邀请码进入批发业务推荐关系。
- 当前旅游业务继续使用现有订单、服务、旅游 VIP、推荐树、佣金和客户管理能力；旅游 VIP 申请、充值确认、充值记录和有效期调整统一进入旅游业务的 VIP 管理板块，旅游订单列表支持按下单日期选择开始和结束日期查看特定时间段的订单。
- 当前旅游业务不包含采购类订单，旅游业务设置不维护采购订单佣金规则。
- 当前旅游订单体系只承载旅游/零售/服务相关订单，不再承载批发订单、批发服务费或批发推荐入口。
- 当前业务模块清单注册 `tourism` 和 `wholesale` 两个业务。导航分组、角色可用模块、旅游/批发页面入口和业务内设置都从 `lib/workspace-business-modules.ts` 组装；工作台总配置不再直接维护每个业务的导航细节。
- 新批发业务保留在同一个后台壳内，但不复用旅游订单结构；批发客户、订单、订单修改申请、订单修改记录、1688 采购单、物流、客户推荐佣金、业务员提成、推荐关系和 VIP 权益分别走 `wholesale_customers`、`wholesale_orders`、`wholesale_order_edit_requests`、`wholesale_order_change_logs`、`wholesale_1688_orders`、`wholesale_logistics_orders`、`wholesale_commissions`、`wholesale_referrals` 和批发 VIP 相关表等独立模型。
- 业务入口不再由管理员在人员管理里手动开关；管理员固定同时可见旅游业务和批发业务，财务和业务员固定只可见批发业务，地推、经理、运营和招聘员固定只可见旅游业务；客户按业务标记进入，拥有批发业务标记的客户可见批发业务，只有旅游业务标记的客户只可见旅游业务。
- 各业务下客户管理与人员管理分开。旅游客户进入旅游业务的客户管理，旅游人员管理只保留旅游业务人员；批发客户进入批发业务的客户管理，批发人员管理只在管理员工作台展示，用于查看可承接批发客户和订单的业务员账号，业务员工作台不显示人员管理板块。
- 批发客户管理中，管理员查看全部批发客户，业务员只查看自己创建或分配给自己的批发客户，以及与这些客户相关的账号资料。批发客户以客户唯一标识名称作为业务上的唯一客户名，可以先不绑定系统账号，由业务员登记联系方式、其他名称和客户来源；客户后续完成注册后，管理员或负责该客户的业务员可以在客户详情里选择客户注册账号进行关联合并，系统不会新建第二个批发客户记录，而是把注册账号绑定到原客户并开通批发业务可见权限，客户登录后可以查看同一客户名下的订单、物流、推荐关系、佣金和 VIP 权益。
- 批发客户、批发订单、物流、客户推荐和 1688 采购单认领的写入权限以数据库为准：管理员可以管理全部批发数据，财务和业务员只能管理自己创建或分配给自己的批发客户及其相关订单、物流和推荐关系，不能替其他业务员建单、转派客户或认领到其他人的客户名下。
- 批发业务设置里维护“订单录入后可直接修改天数”，默认 30 天，管理员可以调整。业务员只能在自己可管理订单的这个天数内直接修改订单；超过后需要提交修改申请，由管理员在批发订单页处理。每次直接修改和管理员通过申请后的修改都会写入批发订单修改记录，记录修改前后内容和操作人。
- 批发客户合并注册账号时，管理员可以选择符合条件的客户账号；业务员只能选择通过自己批发注册链接注册、邮箱已验证、未停用且尚未合并过的客户账号。合并后由数据库开通该客户账号的批发业务可见权限。
- 批发订单和客户分配时，可选承接人只包含已开通批发业务的业务员，不包含地推账号。
- 批发 VIP 作为批发业务的独立侧栏板块展示。管理员和业务员在自己可管理的批发客户范围内直接开通或续费；开通从当天开始向后记录一年，续费按当前结束时间延长一年，两类操作都会再次弹窗确认，并按 200 USD 年费写入操作记录，不生成业务员 VIP 佣金。客户列表只保留客户、当前状态和操作入口；页面下方单独展示 VIP 操作记录，点击客户可查看该客户全部开通和续费记录。
- 批发订单字段包含订单编号、客户名、关联业务员、订单状态、下单时间、结汇时间、小单数量、产品采购金额、打包费、国际运费、其他费用、推荐佣金费用、快递公司、结汇汇率、客户支付币种、客户支付金额、人民币金额、收款平台、毛利率、单位毛利、备注和订单计入月份；订单编号由数据库按旅游订单同一套每日序号规则自动生成，打包费按 `小单数量 * 3` 自动计算。未结汇订单不提前记录结汇汇率，人民币金额、毛利、毛利率、单位毛利和业务员订单提成在结汇后计算。
- 新建批发订单时只记录客户支付币种、客户支付金额、成本费用、收款平台和订单月份，不使用历史汇率折算人民币金额。客户支付币种从当前可用币种中选择，结汇汇率在订单结汇时确认。
- 批发订单状态只分为“未结汇”和“已结汇”；新建订单默认未结汇，下单时间与订单号生成时间一致。关联业务员、建单人或管理员在订单列表固定列中标记已结汇时，系统只自动使用北京时间当天的对应币种汇率；当天没有汇率时，结汇弹窗允许填写本次实际使用的结汇汇率，并自动写入结汇时间。
- 已结汇订单如果结汇汇率录错，拥有该订单管理权限的管理员或业务员可以在“修改订单”弹窗里的结汇汇率栏修改单笔订单，也可以勾选多笔已结汇订单后批量修改同一个结汇汇率；每次修改都会写入批发订单修改记录，并重新计算人民币金额、毛利、毛利率、单位毛利和业务员订单提成。
- 批发毛利按 `客户支付人民币金额 - 产品采购金额 - 国际运费 - 打包费 - 其他费用 - 推荐佣金费用` 自动计算；业务提成按毛利乘以批发业务设置里的比例计算，默认订单人民币金额 `10000` 以内取毛利 `10%`，超过后取毛利 `12%`。
- 批发客户推荐佣金按月统计，同一被推荐客户当月佣金由两套规则相加：批发订单人民币金额默认按 `2%` 计算，运单数量超过 `200` 单加 `50 USD`、超过 `1000` 单加 `200 USD`、超过 `5000` 单加 `500 USD`，美元奖励按当前 USD 兑人民币汇率折算后计入合计。订单数量口径未来以运单号系统为准；在运单号系统完成前，页面先使用现有批发物流记录作为运单数量来源。上述比例、门槛和奖励金额在批发业务设置中维护。
- 一笔批发订单可以关联多条 1688 采购订单，也可以关联多条物流订单；批发订单列表直接展示这两类关联记录的摘要，搜索订单时同时匹配关联采购单和物流单号，并支持按下单日期选择开始和结束日期查看特定时间段的订单；选择好当前范围后，可以生成业务口径的 AI 订单评估，评估内容使用普通中文展示，覆盖订单数量、结汇状态、客户支付金额、采购成本、各类费用、毛利表现、风险点和下一步建议。
- 批发订单、1688 采购订单和物流运单列表采用横向表格直接展示完整信息，不再通过点击订单打开详情弹窗；订单类列表的订单号固定在左侧，物流列表的运单号固定在左侧，方便横向滑动时仍能对齐当前行。批发表格长列表在表格区域内滚动，表头固定在列表顶部，查看下方订单时仍能看到订单编号、客户、业务员等字段含义；移动端继续保留横向滑动，不压缩列宽导致文字竖排或按钮挤压。
- 1688 采购订单可以通过页面 CSV 或登录后的 `/api/wholesale/1688-orders` 接口接收，进入订单认领列表；订单认领页分为“已认领 / 待分类 / 认领大厅”。API 接收的 1688 订单如果能根据客户或批发订单信息确定归属，会自动进入已认领；CSV 上传从订单认领页按钮打开弹窗完成，不直接铺在页面顶部，CSV 行会先按收款人名字辅助匹配批发客户，匹配到客户的进入待分类，业务员确认关联批发订单后进入已认领；没有辅助匹配到客户的进入认领大厅，由业务员手动认领。业务员只能认领并归属自己可管理的客户和批发订单，认领后列表显示认领者用户名，原始采购订单内容进入系统后不允许随意修改，误上传数据只能由管理员移出认领列表。
- 物流模块记录来源工作流订单编号、国际订单号、目的地订单号、货代、每日进度和物流费用；每批物流记录可以归属到指定批发客户。
- 未开通批发业务的账号即使手动输入批发地址，也会看到访问错误页。
- 外侧设置只保留汇率设置，维护自动获取币种、手动补充汇率和历史记录；旅游业务设置放在旅游业务侧栏内，维护旅游订单服务费、服务价格、服务折扣和服务相关佣金；批发业务设置放在批发业务侧栏内，维护批发订单修改规则、批发订单业务员提成和批发客户推荐佣金。
- 全局账号管理只展示已完成邮箱验证的账号；账号列表只直接展示账号、身份/状态、城市、我的备注和操作，推荐码、推荐人、团队、直接推荐人数、创建时间等基础资料通过点击账号后的详情弹窗查看；账号身份、状态和城市只在这里调整，客户标记、VIP、订单、佣金、物流等业务资料不进入全局账号页。
- 旅游业务客户管理单独查看旅游客户；旅游业务人员管理只查看旅游业务人员。两个板块都只做搜索、状态筛选和详情查看，不承载账号身份调整，也不承载 VIP 申请或审核。
- 批发业务客户管理可以新增、搜索、筛选、查看批发客户，并与注册账号关联合并；批发业务人员管理只在管理员工作台查看批发承接人账号，业务员不显示该板块。VIP 开通、续费和有效期调整进入批发 VIP 管理。
- 人员管理和客户管理里的“我的备注”按当前登录账号单独保存，只显示给填写人本人；管理员、业务员和地推只能给自己可见的账号或客户填写或清空备注。
- 个人资料中姓名和城市按资料修改规则处理：管理员修改自己立即生效，其他角色提交后进入管理员审核。
- “我的”页的个人照片和视频提交面向所有有个人中心的角色；地推账号与业务员一样可以提交和删除自己待审核的个人媒体。
- “我的”页可在当前浏览器会话保存 1 个额外常用账号；添加或重新启用都必须重新登录，重新登录必须匹配目标账号，成功切换会刷新 8 小时有效期，关闭浏览器会话后需要重新添加。
- 公告按发布对象和当前账号角色过滤；管理员管理页可维护全部公告。
- 首页由可自定义组件组成，组件按 5 列固定坐标网格摆放，单个组件宽高限制在 `1 x 1` 到 `5 x 5`；编辑组件后首页组件进入轻微摇晃状态，桌面端原左侧功能栏会向左收回并切换为添加组件侧栏，结束编辑后再切回功能栏；可重复添加问候卡片、当前时间、我的邀请码、公告栏和我的待办；拖动组件本体时组件会实时跟随鼠标并在松手后落到指定网格位置，按下后需要有明确移动才进入拖动，避免和删除等按钮操作互相抢占；鼠标靠近组件边缘时，角点只在同时靠近两条边时出现，边缘中段固定显示对应边的缩放把手，左右边显示竖向短把手，上下边显示横向短把手，四个角显示 L 形角把手；新增组件从小点放大进入，缩放时组件边界会平滑过渡，拖动中断或窗口失焦后页面会恢复正常操作，删除组件先收缩到小点再移除；布局按当前登录账号保存到 Supabase。
- 首页当前时间组件显示自动刷新的北京时间，小尺寸状态保留短标题、数字时间和表盘摘要，放大后展示日期和时区说明。
- 首页个人邀请码组件读取当前账号的邀请码；普通账号可复制邀请码和通用注册链接，业务员只生成批发业务注册链接，地推只生成旅游业务注册链接。
- 首页个人待办只属于当前登录账号，支持新增、编辑、完成/恢复、删除、重要标记、截止日期、备注和全部/未完成/已完成筛选；重复放置多个待办组件时共用同一份待办状态；快速添加栏的输入框、截止日期、重要标记和提交按钮保持同一行同一高度；数据读取和写入通过 `lib/user-todos.ts` 与 Supabase `user_todo_items` / `create_user_todo` / `update_user_todo` / `delete_user_todo` 对接。
- 任务领取、提审、审核和完成状态统一进入 `task_acceptances`；多人任务父任务只保留名额和进度。
- 任务审核保留在管理员任务板内；已通过审核的成员上传文件集中进入“任务媒体库”，支持按任务、提交人和文件类型检索，图片、视频和 PDF 可站内预览，其他文件提供下载。
- 任务附件策略统一由 `lib/task-attachment-policy.ts` 维护。
- 个人照片上传后可进入智能初审；供应商未配置或返回需复核时仍进入人工审核。

## 用户体验规则

- 页面文案必须使用普通用户能理解的日常语言。
- 用户可见文案禁止暴露数据库表名、字段名、状态码、bucket、RPC、JSON、同步请求等技术细节。
- 登录、语言切换、路由跳转、刷新、上传、审核和保存动作都要有明确等待反馈，并避免重复点击。
- 工作台业务板块页头默认不展示统计小卡片；全局账号管理、各业务客户管理和人员管理保留人数和状态概览，列表只保留关键列，更多资料放入详情弹窗，其他板块以筛选、列表、表格和分段切换承载主要信息。
- 汇率设置、旅游业务设置和批发业务设置分别从各自入口进入，页面顶部只保留对应页头；内容卡片直接进入实际小节、表格或控件，不再放重复的一级说明标题。
- 设置类规则、价格和折扣表在桌面端使用表格，在移动端使用分条卡片展示，不能要求用户横向滑动才能看到当前值、计算方式或操作按钮。
- 首页组件编辑态只保留必要操作：编辑组件、完成、添加、移除、移动和拖动改大小；小尺寸组件必须显示摘要内容，不把完整表单或长列表硬塞进 `1 x 1`、`2 x 1` 等小卡片。
- 常用账号切换只在当前浏览器会话保存会话快照，不保存密码，不再写入长期本地存储；备用账号超过 8 小时未使用、关闭浏览器会话或会话失效时改为重新登录入口，界面保持单行轻量展示：无备用账号时显示加号入口，有备用账号时显示头像、角色、姓名、邮箱和切换按钮。
- 账号中心的修改密码入口发送重置邮件后要显示再次发送倒计时，避免用户因为邮箱暂未收到而连续触发发信限制；成功提示只说明邮件已开始发送，不能承诺已经进入收件箱。
- 页面长时间隐藏或窗口失焦后，涉及客户端跳转或刷新时要使用 `lib/use-stale-focus-recovery.ts` 做整页加载兜底。
- 移动端需要检查文字竖排、换行挤压、遮挡、横向溢出、按钮压缩和表格挤压；标题、备注、弹窗说明等用户可输入长文本要在组件内自然换行，不能撑出横向滚动。
- 共享组件的响应式问题要从组件层修复，不只修截图里的单个位置。

## 数据与 Supabase

- Web 仓库不保存数据库迁移源文件；迁移源在 `D:\code\code-project\supabase`。
- Web 改动如果依赖新表、新字段、新 RPC 或 Edge Function，必须先在本地 Docker Supabase 验证，再按 Supabase 操作指南上传。
- 账号角色和状态以 Supabase 数据库里的用户资料和角色关联为准，Auth 元数据只做兜底，避免旧账号的登录令牌信息滞后时被误判为无权限。
- 账号可见业务由 Supabase 里的工作区业务可见范围记录、角色固定规则和对应 RPC 提供，Web 只负责读取后结合业务模块清单过滤导航和路由；管理员固定双业务，财务和业务员固定批发，地推固定旅游。当前登录用户的业务权限读取异常或返回空时，Web 会按已验证角色和 active 状态使用固定默认业务范围，避免固定业务角色因临时读取失败误显示为没有业务入口。
- Supabase 上传完成后，再提交和推送 Web 仓库。
- Function secrets、供应商密钥和真实服务凭据只放在 Supabase secrets 或本机 `.env.local`，不能写入仓库。

## 测试与验证

代码改动后固定检查：

- 更新 `README.md` 中相关说明。
- 使用 Playwright 在真实浏览器环境验证受影响页面。
- 使用 `D:\code\code-project\测试账号.txt` 中的测试账号验证登录、跳转和权限链路；本地 Supabase 验证时 e2e 默认优先读取 `local.*@bs.test` 本地账号，环境变量仍可覆盖。
- 检查桌面和移动宽度下是否有文字竖排、遮挡、溢出或按钮/表格压缩。
- 运行与改动风险匹配的命令，通常至少包括 `npm run lint`、`npm run typecheck`，重要改动再跑 `npm run build`。

文档-only 改动：

- 不需要启动浏览器验证。
- 仍应运行 `git diff --check`，确认 Markdown 没有空白字符问题。

自动化回归：

- `playwright.config.ts` 默认使用 `http://localhost:3000`。
- 如果 `3000` 不是当前项目服务，不要直接运行默认 e2e；先设置 `PLAYWRIGHT_BASE_URL` 指向当前项目端口，已手动启动 dev server 时同时设置 `PLAYWRIGHT_SKIP_WEB_SERVER=1`。
- `tests/e2e` 覆盖登录、角色首页、越权拦截和关键工作区入口。
- 测试账号优先读取 `E2E_*` 环境变量；未设置时，若当前 `.env.local` 指向本地 Supabase，则优先从同级 `supabase/local-test-data.sql` 或 `baisheng-supabase/local-test-data.sql` 读取 `local.*@bs.test` 账号，再读取本机测试账号文件。
- 回归产物输出到 `output/playwright-results` 和 `output/playwright-report`，不提交。

## 构建与本地产物

仓库已忽略：

- `.next/`
- `.playwright-cli/`
- `output/`
- `node_modules/`
- `*.tsbuildinfo`

清理建议：

- `.next` 是可再生缓存，只在磁盘压力大或怀疑缓存脏时清理。
- `.playwright-cli` 和 `output/playwright` 是临时验证产物，应定期清理。
- 有价值的截图和报告可以短期保留在 `output/playwright/screenshots` 和 `output/playwright/reports`。

## 部署与上传

部署建议：

- Framework：`Next.js`
- Build Command：`npm run build`
- Start Command：`npm run start`
- Output Directory：`.next`

Git 推送约定：

- 默认直接推送 `origin/main`。
- 推送前确认在 `main` 分支。
- 只暂存本次相关文件。
- 推送后用 `git ls-remote origin refs/heads/main` 确认远端 HEAD。
- 详细流程以 `D:\code\code-project\web项目说明及推送流程.md` 为准。

Supabase Auth 建议：

- Site URL：线上站点根地址，当前线上为 `https://account.pt5china.com`；默认值集中在 `lib/company-config.ts`。
- `NEXT_PUBLIC_SITE_URL` 应与线上 Site URL 保持一致；邮箱确认路由只接受该域名、公司配置默认线上域名和本地开发域名作为回跳来源。
- Redirect URLs：线上根地址、`/login`、`/auth/confirm`、`/forgot-password`，以及本地开发地址 `http://localhost:3000`、`http://localhost:3000/auth/confirm`、`http://localhost:3000/forgot-password`。
- `/auth/confirm` 统一处理注册确认和密码重置确认：`type=email` 成功后进入 `next` 指向的登录页；`type=recovery` 成功后进入 `/forgot-password?type=recovery` 设置新密码。
- Confirm sign up 邮件模板使用自有域名确认路由：`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}`，不要直接使用 `{{ .ConfirmationURL }}`，避免注册确认邮件里的主链接显示为 Supabase 项目域名。
- Reset password 邮件模板也使用自有域名确认路由：`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}`，避免重置邮件里的主链接显示为 Supabase 项目域名。
- Password recovery 邮件由登录页和账号中心共同触发，回跳地址固定为当前站点的 `/forgot-password`；Resend 显示 sent 只代表发信服务已接收或开始发送，delivered 只代表收件方服务器已接收，仍需结合 Resend Insights、收件箱、垃圾邮件和域名 DNS 认证状态判断最终可见性。
- 注册和重置密码统一要求至少 10 位，并同时包含大写字母、小写字母和数字；前端表单校验要与 Supabase Auth 的 `minimum_password_length`、`password_requirements` 和 `secure_password_change` 配置保持一致。
- 注册页允许匿名调用的邀请码校验 RPC 只有 `validate_signup_referral_code` 和 `resolve_signup_referral_business_board`；管理、批发、VIP、任务和触发器辅助 RPC 都应在数据库侧撤销匿名执行权。
- 自定义 SMTP 发件人使用可回复的业务邮箱，不使用 `noreply`。当前发件地址和发件名以公司配置和 Supabase Auth 设置为准。

## 相关文档

- [web项目说明及推送流程.md](D:/code/code-project/web项目说明及推送流程.md)
- [SUPABASE操作指南.md](D:/code/code-project/SUPABASE操作指南.md)
