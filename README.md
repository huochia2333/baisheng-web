# 柏盛管理系统 Web 前端

柏盛管理系统 Web 端，基于 `Next.js 16 App Router`、`React 19`、`TypeScript`、`Tailwind CSS 4`、`Supabase` 和 `next-intl` 构建。项目目录位于 `D:\code\code-project\baisheng-web`。

## 技术栈

- `Next.js 16` + App Router
- `React 19`
- `TypeScript 5`
- `Tailwind CSS 4`
- `Supabase Auth` / `@supabase/ssr` / `@supabase/supabase-js`
- `next-intl` 中英双语
- `Playwright` 真实浏览器验证

## 当前能力

- 登录、注册、忘记密码、密码重置
- 基于 Supabase claims 的角色识别与登录后跳转
- 通过 `proxy.ts` 自动续会话、未登录保护、越权路由纠正
- 多角色工作台入口与共享“我的”资料页
- 管理员、业务员、客户等角色的业务页面与工作台壳
- 中英语言切换，文案由 `messages/zh.json` 与 `messages/en.json` 管理

## 角色与默认入口

| 角色 | 默认入口 | 当前导航/模块概况 |
| --- | --- | --- |
| `administrator` | `/admin/my` | `my`、`orders`、`referrals`、`team`、`commission`、`exchange-rates`、`tasks`、`reviews` |
| `salesman` | `/salesman/my` | `my`、`orders`、`referrals`、`team`、`commission`、`exchange-rates`、`tasks` |
| `recruiter` | `/recruiter/my` | `my`、`referrals`，其余导航项仍有过渡/占位实现 |
| `manager` | `/manager/my` | `my`、`referrals`、`team` |
| `operator` | `/operator/my` | `my`、`referrals`、`team` |
| `finance` | `/finance/my` | `my`、`referrals`、`team`，部分佣金相关入口仍在过渡态 |
| `client` | `/client/my` | `my`、`orders`、`referrals` |

说明：

- 角色基础映射定义在 `lib/auth-routing.ts`
- 角色导航与分段能力定义在 `lib/workspace-config.ts`
- `/[role]` 会自动重定向到对应角色的 `/[role]/my`
- 部分页面已经接入真实数据，部分仍为占位或过渡实现

## 路由结构

- `app/(auth)`：认证页，包含 `/`、`/login`、`/register`、`/forgot-password`
- `app/(workspace)/[workspace]/my`：各角色共享“我的”页入口
- `app/(workspace)/[workspace]/[section]`：按角色动态装配订单、审核、任务、佣金、汇率、推荐树、团队等页面
- `proxy.ts`：会话同步、鉴权跳转、角色越权纠正

## 本地开发

1. 安装依赖：

```bash
npm install
```

2. 复制环境变量文件：

```bash
Copy-Item .env.example .env.local
```

3. 启动开发环境：

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

- `NEXT_PUBLIC_*` 用于浏览器端与 SSR 访问 Supabase
- `SUPABASE_SERVICE_ROLE_KEY` 仅供脚本或受控服务端管理任务使用，不能暴露到前端
- `.env.local` 不应提交到仓库

## 常用命令

```bash
npm run dev
npm run lint
npm run build
npm run start
npm run supabase:admin -- summary
```

补充说明：

- `npm run supabase:admin -- summary` 用于查看订单与汇率等表的概览
- `npm run build` 会生成 `.next/`

## 目录结构

- `app/`：Next.js App Router 页面、布局、错误页与样式入口
- `components/`：认证组件、工作台组件、通用 UI
- `lib/`：Supabase 客户端、鉴权路由、工作台配置、业务数据访问
- `i18n/`：`next-intl` 请求配置
- `messages/`：中英文消息字典
- `scripts/`：开发辅助脚本
- `docs/`：补充设计或审计文档
- `public/`：静态资源

## 测试与验证要求

- Web 项目改动后，需要在真实浏览器环境中验证改动页面
- 使用 Playwright 结合测试账号执行登录与页面验证
- 至少确认改动页面中的按钮可点击、登录后的角色跳转正确、访问权限符合预期
- 测试账号见仓库根目录 `D:\code\code-project\测试账号.txt`

## 部署与相关文档

部署建议：

- Framework: `Next.js`
- Build Command: `npm run build`
- Start Command: `npm run start`
- Output Directory: `.next`

Supabase Auth 建议配置：

- Site URL：线上站点根地址
- Redirect URLs：线上根地址、`线上域名/forgot-password`、`http://localhost:3000`、`http://localhost:3000/forgot-password`

相关文档：

- `D:\code\code-project\web项目说明及推送流程.md`
- `D:\code\code-project\SUPABASE操作指南.md`
- `D:\code\code-project\baisheng-web\docs\content-i18n-audit.md`
