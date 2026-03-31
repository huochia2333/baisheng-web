# 柏盛账户系统前端

这是柏盛系统的 Web 前端项目，基于 `Next.js 16`、`React 19`、`TypeScript`、`Tailwind CSS 4` 和 `Supabase` 构建，当前仓库正式开发目录为 `D:\code\code-project\baisheng-web`。

## 当前已实现

- 登录、注册、忘记密码/重置密码
- 按角色登录后自动跳转
- 管理员工作台 ` /admin/* `
- 业务员工作台 ` /salesman/* `
- `operator / manager / finance / client` 四类角色独立工作台 ` /workspace/* `
- 四类角色当前仅开放左侧“我的”菜单，`/workspace/my` 显示占位页
- 管理员审核中心 ` /admin/reviews `
- 管理员订单页 ` /admin/orders `
- 公共“我的”资料页能力复用

## 角色路由规则

- `administrator` -> `/admin/my`
- `salesman` -> `/salesman/my`
- `operator` -> `/workspace/my`
- `manager` -> `/workspace/my`
- `finance` -> `/workspace/my`
- `client` -> `/workspace/my`

## 本地启动

```bash
npm install
npm run dev
```

默认访问地址：

- `http://localhost:3000`
- `http://localhost:3000/login`
- `http://localhost:3000/register`
- `http://localhost:3000/forgot-password`

常用命令：

```bash
npm run lint
npm run build
npm run start
```

## 环境变量

复制 `.env.example` 为 `.env.local`，至少配置：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase 项目地址
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的 Supabase Publishable Key
SUPABASE_SERVICE_ROLE_KEY=仅脚本/服务端管理任务需要时配置
```

说明：

- `NEXT_PUBLIC_*` 用于前端访问 Supabase
- `SUPABASE_SERVICE_ROLE_KEY` 仅供脚本或受控服务端场景使用，不要暴露到前端
- `.env.local` 不应提交到 Git

## 部署建议

- Framework: `Next.js`
- Build Command: `npm run build`
- Start Command: `npm run start`
- Output Directory: `.next`

Supabase Auth 建议配置：

- Site URL: 线上站点根地址
- Redirect URLs:
  - 线上根地址
  - `线上域名/forgot-password`
  - `http://localhost:3000`
  - `http://localhost:3000/forgot-password`

## 目录结构

- `app/`：App Router 页面与路由
- `components/`：认证页、工作台页面、通用 UI
- `lib/`：Supabase 客户端、角色逻辑、业务数据访问
- `scripts/`：辅助脚本
- `public/`：静态资源

关键文件：

- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/forgot-password/page.tsx`
- `app/admin/my/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/reviews/page.tsx`
- `app/salesman/my/page.tsx`
- `app/workspace/my/page.tsx`
- `components/dashboard/admin-shell.tsx`
- `components/dashboard/dashboard-shared-my-client.tsx`
- `components/dashboard/workspace-my-placeholder.tsx`
- `lib/user-self-service.ts`
- `lib/supabase.ts`

## 当前仍是占位的模块

- 业务员的多数业务模块仍在逐步补齐
- `operator / manager / finance / client` 当前仅提供基础工作台壳和“我的”占位页
- 推荐树、团队、佣金、汇率、任务等页面仍以占位或过渡实现为主
