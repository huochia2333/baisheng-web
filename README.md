# 柏盛账户系统前端

当前项目是一个基于 Next.js 16、App Router、TypeScript、Tailwind CSS 和 Supabase 的前端站点。

当前已完成的核心页面：
- 登录页
- 注册页
- 忘记密码 / 重置密码页
- 管理员后台首页
- 管理员「我的」页面

## 目录说明

目前工作区里存在两份相同代码：
- `D:\code\code-project\web`
  - 本地开发目录
- `D:\code\code-project\baisheng-web`
  - 已连接 GitHub 仓库 `huochia2333/baisheng-web` 的同步目录

当前这份 README 位于 `baisheng-web` 目录，并且这个目录已经连接 GitHub 远端。

如果后续继续开发，建议统一只使用一份目录，避免两个目录内容再次不同步。

## 本地启动

在当前目录执行：

```bash
npm install
npm run dev
```

本地默认访问地址：
- `http://localhost:3000`
- `http://localhost:3000/login`
- `http://localhost:3000/register`
- `http://localhost:3000/forgot-password`
- `http://localhost:3000/admin/my`

常用命令：

```bash
npm run lint
npm run build
npm run start
```

## 环境变量

复制 `.env.example` 为 `.env.local`，然后填写：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase 项目地址
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的 Supabase Publishable Key
```

当前项目读取环境变量的位置：
- `lib/supabase.ts`

## 部署信息

当前计划使用的正式地址：
- `https://account.pt5china.com/`

部署平台建议配置：
- Framework: `Next.js`
- Build Command: `npm run build`
- Output Directory: `.next`
- Package Manager: `npm`

部署平台环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Supabase Auth 配置

在 Supabase 后台建议配置：

- Site URL
  - `https://account.pt5china.com`
- Redirect URLs
  - `https://account.pt5china.com`
  - `https://account.pt5china.com/forgot-password`
  - 本地调试时也建议加入：
    - `http://localhost:3000`
    - `http://localhost:3000/forgot-password`

## 代码结构

主要目录：
- `app/`
  - Next.js App Router 页面
- `components/`
  - 认证页、后台页面和基础 UI 组件
- `lib/`
  - Supabase 客户端和业务数据访问封装
- `public/`
  - 静态资源

关键文件：
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/forgot-password/page.tsx`
- `app/admin/my/page.tsx`
- `components/dashboard/admin-my-client.tsx`
- `lib/supabase.ts`
- `lib/user-self-service.ts`
