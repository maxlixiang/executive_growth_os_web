# Executive Growth OS Web

Executive Growth OS 的独立 Mobile-first Web App。它把课程标准、主动回忆、真实工作、AI 反馈、间隔复习和周期考核连接成长期成长闭环。

本仓库与 Executive Growth OS CLI、Career OS 和大米的小站完全独立，不共享数据库，不同步或迁移私人用户数据。

## 技术栈

- Next.js 16 App Router
- React 19 + TypeScript strict
- Tailwind CSS 4
- Supabase Auth / Postgres / RLS
- Zod
- DeepSeek API（仅服务端）

## 本地运行

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

在独立 Supabase Project 建立后填写：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

DeepSeek 环境变量：

```dotenv
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

不得创建 `NEXT_PUBLIC_DEEPSEEK_API_KEY`。

未配置 Supabase 时，Dashboard 只在 `next dev` 中作为 W1 视觉预览开放；production 默认关闭并跳转到 `/login`。

## 验证

```powershell
npm run typecheck
npm run lint
npm run build
```

数据库 migration 位于 `supabase/migrations/`。共享课程表仅允许 authenticated 用户读取；所有私人表直接包含 `user_id` 并启用 RLS。

## 当前阶段

W1：项目初始化、Supabase Auth/RLS 基础、Mobile App Shell、Dashboard Skeleton。
