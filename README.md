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

- `Next.js 16.2.3` + App Router
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
- Playwright 或本地验证建议固定使用 `http://127.0.0.1:3000`，避免热更新资源来源不一致。
- `.env.local`、真实密钥、测试账号和本地产物不能提交。

## 环境变量

至少需要：

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

- `NEXT_PUBLIC_*` 用于浏览器端和 SSR 访问 Supabase。
- `SUPABASE_SERVICE_ROLE_KEY` 只允许服务端脚本或受控管理任务使用，不能暴露到前端。
- `EXCHANGE_RATE_API_KEY` 只配置为 Supabase Edge Function secret。
- `USER_MEDIA_IMAGE_REVIEW_PROVIDER` 和真实内容安全供应商密钥只配置为 Supabase Function secrets，默认 provider 为 `disabled`。
- `DEEPSEEK_API_KEY` 只在 Next.js 服务端接口中使用，用于登录后右下角的柏盛助手。

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

当前系统使用统一动态工作台，不再为每个角色维护一套散落页面。

| 角色 | 默认入口 | 当前模块 |
| --- | --- | --- |
| `administrator` | `/admin/home` | 首页、公告、订单、推荐树、团队、人员、操作记录、佣金、系统设置、任务、审核、反馈 |
| `salesman` | `/salesman/home` | 首页、订单、人员、推荐树、团队、佣金、汇率、任务 |
| `client` | `/client/home` | 首页、订单、推荐树 |
| `manager` | `/manager/home` | 首页、推荐树、团队、任务 |
| `operator` | `/operator/home` | 首页、推荐树、团队、任务 |
| `finance` | `/finance/home` | 首页、推荐树、团队、任务、佣金 |
| `recruiter` | `/recruiter/home` | 首页、推荐树、任务 |

访问规则：

- `/[role]` 自动重定向到 `/[role]/home`。
- 越权访问直接展示访问错误页，不改写到其他角色工作台。
- 左侧导航只展示当前账号可用模块。
- 已知但未授权的同工作台模块展示访问错误页，不再显示占位入口。

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
│     ├─ home/
│     ├─ my/
│     └─ [section]/
├─ error.tsx
├─ forbidden.tsx
└─ global-error.tsx
```

关键文件：

- `proxy.ts`：会话同步、登录保护、工作台访问前置校验。
- `lib/workspace-config.ts`：角色导航、页面变体和工作台配置中心。
- `lib/auth-routing.ts`：角色与工作台 base path 映射。
- `components/dashboard/admin-shell.tsx`：工作台服务端壳层。
- `components/dashboard/admin-shell-client.tsx`：工作台客户端壳层组装。
- `components/dashboard/use-admin-shell-navigation.ts`：工作台导航点击、预取和失焦恢复后的整页跳转兜底。
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
- `dashboard-home/`：各角色首页组件化工作台；问候、当前时间、个人邀请码、公告和个人待办都作为可重复放置的首页组件呈现，编辑时用红色虚线框标出可放置区域；布局定义、布局状态 hook、组件卡片、侧栏和内容渲染拆在同层模块中；时钟刷新、邀请码复制、待办查询、保存状态、弹窗和展示继续拆分，不放进首页 Client/Page。
- `admin-feedback/`：管理员反馈管理列表、筛选和状态调整。
- `ai-assistant/`：右下角柏盛助手浮窗、聊天状态、流式消息和反馈衔接。
- `lib/account-switcher.ts`：本机常用账号会话切换，不保存密码，不写数据库。

主要业务模块：

- `admin-people/`：管理员人员管理，配合 `lib/admin-people*.ts`。
- `admin-orders/`：管理员订单，配合订单查询、表单、详情、权限和错误映射模块。
- `admin-system-settings/`：管理员系统设置，集中维护订单规则、佣金规则和汇率设置。
- `admin-tasks/`：管理员当前任务板、任务审核、任务媒体库、任务创建、编辑、详情、改派和删除。
- `salesman-tasks/`：内部成员任务接收、提交审核和成果附件。
- `admin-reviews/`：资料修改、隐私审核、媒体审核和智能初审展示；任务审核放在管理员任务板内切换。
- `commission/`：普通佣金、任务佣金和结算操作。
- `referrals/`：零售 / 批发推荐树切换和关系展示。
- `team-management/`：团队创建、成员维护、客户结构和团队详情。
- `dashboard-shared-my/`：个人中心、账号中心、资料、认证分区和“常用账号”入口。

拆分规则：

- `Client` / `Page` 组件只负责组装和调度。
- 查询、mutation、权限、表单状态、弹窗、表格渲染和文案映射不要继续堆在同一个核心文件里。
- 单文件超过 `400-600` 行，或出现 3 个以上独立职责时，优先拆成 `queries`、`mutations`、`view-model hook`、`dialog`、`section/table` 或 `display-utils`。
- 新增功能默认新建同层模块；只有极小改动才允许补进现有文件。

## 当前关键业务规则

- 注册页只展示邀请码入口，不暴露业务类型选择。
- 零售和批发推荐树通过 `business_referrals.business_board` 隔离。
- 业务员订单和人员入口会按“零售 / 批发”授权过滤。
- 系统设置集中维护订单规则、佣金规则和汇率设置；服务费档位以“计算规则”展示短摘要，完整佣金规则在系统设置的佣金规则中维护；批发订单当前不自动生成订单佣金。
- 管理员人员管理只展示已完成邮箱验证的账号，用于账号身份、账号状态、城市和客户业务标记调整；推荐树、团队和佣金分别维护自己的业务边界。
- 个人资料中姓名和城市按资料修改规则处理：管理员修改自己立即生效，其他角色提交后进入管理员审核。
- “我的”页可在本机保存 1 个额外常用账号；添加或重新启用都必须重新登录，重新登录必须匹配目标账号，成功切换会刷新 15 天有效期。
- 公告按发布对象和当前账号角色过滤；管理员管理页可维护全部公告。
- 首页由可自定义组件组成，组件按 5 列固定坐标网格摆放，单个组件宽高限制在 `1 x 1` 到 `5 x 5`；编辑组件后首页组件进入轻微摇晃状态，桌面端原左侧功能栏会向左收回并切换为添加组件侧栏，结束编辑后再切回功能栏；可重复添加问候卡片、当前时间、我的邀请码、公告栏和我的待办；拖动组件本体时组件会实时跟随鼠标并在松手后落到指定网格位置，按下后需要有明确移动才进入拖动，避免和删除等按钮操作互相抢占；鼠标靠近组件边缘时，角点只在同时靠近两条边时出现，边缘中段固定显示对应边的缩放把手，左右边显示竖向短把手，上下边显示横向短把手，四个角显示 L 形角把手；新增组件从小点放大进入，缩放时组件边界会平滑过渡，拖动中断或窗口失焦后页面会恢复正常操作，删除组件先收缩到小点再移除；布局按当前登录账号保存到 Supabase，旧版本保存在本机浏览器的布局会在首次进入首页后自动迁移。
- 首页当前时间组件显示自动刷新的北京时间，小尺寸状态保留短标题、数字时间和表盘摘要，放大后展示日期和时区说明。
- 首页个人邀请码组件读取当前账号的邀请码；普通账号可复制邀请码和注册链接，业务员会按“零售 / 批发”授权复制对应注册链接，避免新客户注册时进入错误业务板块。
- 首页个人待办只属于当前登录账号，支持新增、编辑、完成/恢复、删除、重要标记、截止日期、备注和全部/未完成/已完成筛选；重复放置多个待办组件时共用同一份待办状态；快速添加栏的输入框、截止日期、重要标记和提交按钮保持同一行同一高度；数据读取和写入通过 `lib/user-todos.ts` 与 Supabase `user_todo_items` / `create_user_todo` / `update_user_todo` / `delete_user_todo` 对接。
- 任务领取、提审、审核和完成状态统一进入 `task_acceptances`；多人任务父任务只保留名额和进度。
- 任务审核保留在管理员任务板内；已通过审核的成员上传文件集中进入“任务媒体库”，支持按任务、提交人和文件类型检索，图片、视频和 PDF 可站内预览，其他文件提供下载。
- 任务附件策略统一由 `lib/task-attachment-policy.ts` 维护。
- 个人照片上传后可进入智能初审；供应商未配置或返回需复核时仍进入人工审核。

## 用户体验规则

- 页面文案必须使用普通用户能理解的日常语言。
- 用户可见文案禁止暴露数据库表名、字段名、状态码、bucket、RPC、JSON、同步请求等技术细节。
- 登录、语言切换、路由跳转、刷新、上传、审核和保存动作都要有明确等待反馈，并避免重复点击。
- 工作台业务板块页头默认不展示统计小卡片；人员管理保留人数和状态概览，其他板块以筛选、列表、表格和分段切换承载主要信息。
- 系统设置页只在页面顶部保留总页头；订单规则、佣金规则、汇率设置的页签内容统一使用内容卡片，卡片内直接进入实际小节、表格或控件，不再放重复的一级说明标题。
- 首页组件编辑态只保留必要操作：编辑组件、完成、添加、移除、移动和拖动改大小；小尺寸组件必须显示摘要内容，不把完整表单或长列表硬塞进 `1 x 1`、`2 x 1` 等小卡片。
- 常用账号切换只保存本机会话快照，不保存密码；备用账号超过 15 天未使用或会话失效时改为重新登录入口，界面保持单行轻量展示：无备用账号时显示加号入口，有备用账号时显示头像、角色、姓名、邮箱和切换按钮。
- 页面长时间隐藏或窗口失焦后，涉及客户端跳转或刷新时要使用 `lib/use-stale-focus-recovery.ts` 做整页加载兜底。
- 移动端需要检查文字竖排、换行挤压、遮挡、横向溢出、按钮压缩和表格挤压；标题、备注、弹窗说明等用户可输入长文本要在组件内自然换行，不能撑出横向滚动。
- 共享组件的响应式问题要从组件层修复，不只修截图里的单个位置。

## 数据与 Supabase

- Web 仓库不保存数据库迁移源文件；迁移源在 `D:\code\code-project\supabase`。
- Web 改动如果依赖新表、新字段、新 RPC 或 Edge Function，必须先在本地 Docker Supabase 验证，再按 Supabase 操作指南上传。
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

- `playwright.config.ts` 默认使用 `http://127.0.0.1:3000`。
- `tests/e2e` 覆盖登录、角色首页、越权拦截和关键工作区入口。
- 测试账号优先读取 `E2E_*` 环境变量；未设置时读取本机测试账号文件。
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

- Site URL：线上站点根地址，当前线上为 `https://account.pt5china.com`。
- Redirect URLs：线上根地址、`/login`、`/auth/confirm`、`/forgot-password`，以及本地开发地址 `http://localhost:3000`、`http://localhost:3000/auth/confirm`、`http://localhost:3000/forgot-password`。
- Confirm sign up 邮件模板使用自有域名确认路由：`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}`，不要直接使用 `{{ .ConfirmationURL }}`，避免注册确认邮件里的主链接显示为 Supabase 项目域名。
- 自定义 SMTP 发件人使用可回复的业务邮箱，不使用 `noreply`。当前发件地址为 `support@pt5china.com`，发件名为“柏盛账号”。

## 相关文档

- [web项目说明及推送流程.md](D:/code/code-project/web项目说明及推送流程.md)
- [SUPABASE操作指南.md](D:/code/code-project/SUPABASE操作指南.md)
