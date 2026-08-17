# Harry · 个人专属顾问

一个只服务你一个人的终身 AI 顾问 Web 应用。

Harry 内置你的完整人生档案（背景、财务、职业、性格弱点、心理机制、认知误区、顾问铁律），
按"绝对客观、零迎合、零讨好"的原则与你对话；支持近况自动更新档案、知识库筛选、简历润色、
每日/每周资讯推荐。数据存在 Supabase 云端，电脑和手机打开自动同步，支持 PWA 添加到手机主屏幕。

---

## 你要做的全部事情（约 10 分钟）

代码、AI 接入、数据库表结构、PWA、部署配置都已准备好。剩下四步，每一步都有具体点击路径：

**① 创建 Supabase 项目（5 分钟）**

1. 打开 [supabase.com](https://supabase.com) 注册 → 新建项目（区域选 Singapore 或 Tokyo）
2. 左侧 **SQL Editor** → 把 `supabase/schema.sql` 全部内容粘贴进去 → Run（一次完成，建 6 张表）
3. 左侧 **Project Settings → API** → 复制 `Project URL` 和 `service_role` 密钥，先记在记事本

**② 把代码放进 GitHub（2 分钟）**

1. 打开 [github.com](https://github.com) → New repository → 名称填 `harry-advisor` → 选 **Private** → Create
   （⚠️ 不要勾选 "Add a README" / ".gitignore" / "license"，保持空仓库，否则后面推送会冲突）
2. 进入新仓库 → **Add file → Upload files** → 把解压出来的项目文件（`api`、`src`、`public`、`supabase`、`package.json` 等）整个拖进去 → Commit changes

**③ 导入 Vercel（2 分钟）**

1. 打开 [vercel.com](https://vercel.com) → 用 GitHub 账号登录 → **Add New → Project**
2. 选择 `harry-advisor` 仓库 → 框架自动识别 Vite，直接 **Deploy**
3. 部署成功后进入 **Settings → Environment Variables**，添加下面 4 个变量，然后 **Redeploy**：

```
DEEPSEEK_API_KEY=你的DeepSeek密钥
SUPABASE_URL=第①步复制的Project URL
SUPABASE_SERVICE_ROLE_KEY=第①步复制的service_role密钥
APP_PASSWORD=改成你自己的登录密码
```

**④ 收尾（1 分钟）**

- 打开 `https://你的项目名.vercel.app`，用刚设置的密码登录
- 手机上用浏览器打开同一网址 → 添加到主屏幕，就是 App

> ⚠️ 为什么不能只传 HTML 到 GitHub Pages：AI 密钥和数据库密钥必须放在服务端，GitHub Pages 是纯静态托管，
> 暴露密钥等于把整个档案和数据送人。所以正确姿势是"GitHub 存代码 + Vercel 跑服务 + Supabase 存数据"，
> 上面的流程就是这三者的最短路径。

---

## 功能一览

| 页面 | 功能 |
| --- | --- |
| 对话 | 流式聊天，Harry 每次回答都会参考你的完整档案 + 最近近况 + 知识库，可切换模型 |
| 我的档案 | 记录近况，AI 自动提炼摘要并更新"最新记忆"，旧档案自动降级 |
| 知识库 | 粘贴任意内容，AI 分类为：当前阶段有用 / 未来有用（封存）/ 有误导性（丢弃） |
| 简历工作台 | 按目标岗位（供应链/采购、商品岗、通用）润色简历，可保存多个版本 |
| 资讯推荐 | 生成"每日一条"或"每周一辑"，每条都说明"为什么对你有用" |
| 设置 | 运行状态、登录、PWA 安装说明、安全提醒 |

## 技术架构

```
React (Vite) 前端
    │
    ▼  /api/*（你部署的 Vercel 服务端函数 / 本地 Express）
    ├── DeepSeek API（代理转发，Key 只在服务端）
    └── Supabase（Postgres 云端数据库，电脑/手机同步）
```

- 前端：React 18 + Vite，深色主题，响应式（手机底部导航 / 电脑侧边栏）
- 后端：Vercel Serverless 函数（`api/` 目录），本地开发由 `server-local.mjs` 提供同样接口
- 数据库：Supabase（生产）；未配置 Supabase 时自动退回本地 `.data/` 目录（仅开发用）
- 认证：个人密码（环境变量 `APP_PASSWORD`），HMAC 签名 Token 有效期 30 天

## 目录结构

```
harry-advisor/
├── api/                    # 后端接口（Vercel 函数 + 本地 Express 通用）
│   ├── _lib/               # 认证、数据库、DeepSeek、提示词、档案种子
│   ├── auth/               # 登录 / 登录状态
│   ├── chat.js             # 对话（SSE 流式）
│   ├── profile*.js         # 档案读取 / 近况更新
│   ├── knowledge*.js       # 知识库
│   ├── resumes*.js         # 简历
│   ├── news*.js            # 资讯
│   ├── conversations*.js   # 对话列表
│   └── config.js           # 运行配置状态
├── src/                    # 前端
│   ├── pages/              # 登录、对话、档案、知识库、简历、资讯、设置
│   ├── lib/                # API 客户端、图标
│   └── App.jsx / index.css
├── public/                 # PWA（manifest、sw.js、图标）
├── supabase/schema.sql     # 建表 SQL（在 Supabase SQL Editor 执行）
├── scripts/make-icons.ps1  # 重新生成应用图标
├── server-local.mjs        # 本地运行后端
├── .env / .env.example     # 环境变量
└── vercel.json / vite.config.js / package.json
```

## 一、本地运行（先试通再部署）

前置：安装 [Node.js](https://nodejs.org) 18 或更高版本。

```bash
cd harry-advisor
npm install
npm run dev
```

浏览器打开 http://localhost:5173 ，密码登录（默认 `harry2026`，务必修改）。

项目里已经带了一个可用的 `.env`（含 DeepSeek Key），所以本地可以直接和 AI 对话；
还没配置 Supabase 时数据会存在本地 `.data/` 文件夹，方便你先体验全部功能。

### .env 变量说明

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API Key |
| `DEEPSEEK_BASE_URL` | 否 | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODELS` | 否 | 可切换模型列表，逗号分隔；默认 `deepseek-v4-pro,deepseek-v4-flash` |
| `DEEPSEEK_DEFAULT_MODEL` | 否 | 兜底模型；所选模型不可用时自动切换 |
| `SUPABASE_URL` | 生产必填 | Supabase 项目地址 |
| `SUPABASE_SERVICE_ROLE_KEY` | 生产必填 | Supabase 服务端密钥（切勿放进前端） |
| `APP_PASSWORD` | 是 | 你的登录密码，部署后立刻改掉默认值 |
| `JWT_SECRET` | 否 | 签名密钥，不填则根据密码自动派生 |
| `PORT` | 否 | 本地后端端口，默认 8787 |

## 二、配置 Supabase（云端数据库，电脑手机同步的关键）

1. 打开 [supabase.com](https://supabase.com) 注册并新建一个项目（免费额度足够单人使用），
   记住数据库密码，选择离你近的区域（如 Singapore/Tokyo）。
2. 等项目初始化完成后，进入 **SQL Editor**，把 `supabase/schema.sql` 的整段内容粘贴进去执行，
   会创建 6 张表：`user_profile`、`conversations`、`messages`、`knowledge_base`、
   `resume_versions`、`news_digest`。
3. 进入 **Project Settings → API**，复制：
   - `Project URL` → 填到 `SUPABASE_URL`
   - `service_role` 密钥 → 填到 `SUPABASE_SERVICE_ROLE_KEY`
     （⚠️ service_role 权限很大，只能放服务端环境变量，绝不能写进前端代码或公开仓库）
4. 本地把这两个值填进 `.env`，重启 `npm run dev`；
   部署到 Vercel 时在 Vercel 的项目环境变量里也填一份。

配置后，在电脑上更新的对话、档案、知识库、简历都会存到云端，手机打开同一网址自动同步。

## 三、部署到 Vercel（手机通过链接访问）

### 方式 A：命令行（最快）

```bash
npm i -g vercel
cd harry-advisor
vercel login
vercel          # 首次会询问配置，一路回车即可，最后得到 https://xxx.vercel.app
vercel --prod   # 以后更新代码后执行这个发布
```

### 方式 B：GitHub 导入

1. 把项目推到 GitHub（注意 `.env` 已在 `.gitignore` 里，不会上传）。
2. 打开 [vercel.com](https://vercel.com) → **New Project** → Import 这个仓库。
3. 框架自动识别为 Vite，无需改构建命令。
4. 在 **Settings → Environment Variables** 里添加（见下方列表），保存后 Deploy。

### 必须配置的环境变量

```
DEEPSEEK_API_KEY=你的key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
APP_PASSWORD=改成你自己的密码
```

部署完成后访问 `https://你的项目.vercel.app`，手机和电脑用同一个网址。

## 四、手机添加到主屏幕（PWA）

- iPhone / iPad：Safari 打开网址 → 底部「分享」→「添加到主屏幕」→ 打开会变成全屏 App。
- Android：Chrome 打开网址 → 右上角菜单 →「安装应用」。

项目已内置 `manifest.webmanifest` 和 Service Worker（`public/sw.js`），
离线时也能打开已缓存的界面；需要重新生成图标时运行 `powershell -File scripts/make-icons.ps1`。

## 五、模型说明（DeepSeek）

聊天页右上角可以切换模型。默认列表在 `DEEPSEEK_MODELS` 里配置。

- 当前 API 环境可用模型：`deepseek-v4-pro`（更强推理）、`deepseek-v4-flash`（更快更省）。
- 以后 API 增加新模型时，把模型名加进 `DEEPSEEK_MODELS` 即可。
- 自动兜底：如果所选模型不存在或暂时不可用，后端会自动用 `DEEPSEEK_DEFAULT_MODEL` 重试，
  并在回复开头注明切换情况，不会让对话卡死。

## 六、记忆机制说明

Harry 每次回答时，服务端会组装 System Prompt，包含：

1. 顾问铁律（零迎合、先评估风险、再给可执行路径等 8 条）
2. 完整用户档案（永久记忆，已内置）
3. 最新近况 + 最近 6 条近况更新（你更新的内容优先于旧档案）
4. 知识库中"当前阶段有用"的条目（最多 10 条，随对话自动参考）
5. 当前对话最近 30 条消息（更早的消息仍保存在云端，可回看，但不会占满上下文）

## 七、常见问题

**登录提示"未配置 APP_PASSWORD"**：Vercel 环境变量里没加 `APP_PASSWORD`。

**聊天报"AI 服务调用失败"**：检查 `DEEPSEEK_API_KEY` 是否正确、余额是否充足；
模型名不存在的会自动兜底，若仍失败请查看返回的具体错误信息。

**本地是"本地模式"**：设置页显示"本地模式"说明 `.env` 里还没有 Supabase 配置，
数据存在 `.data/` 目录；要跨设备同步必须按第二节配置 Supabase。

**部署后设置页显示"未配置"**：环境变量填好后需要 **Redeploy**（重新部署）才会生效。

**生成资讯/知识库分类失败**：这些功能调用 DeepSeek 生成，需要 Key 可用且网络正常；
Vercel 免费版函数最长执行 60 秒，若偶发超时重试一次即可。

**手机打不开 / 白屏**：确认 Vercel 部署成功并访问的是生产域名；
如果改了 `vercel.json` 或加了路由，重新部署。

## 八、数据与安全

- DeepSeek Key、Supabase service_role 密钥、登录密码全部只在服务端环境变量中，前端拿不到。
- 登录使用 HMAC 签名 Token（30 天有效），API 未带有效 Token 一律 401。
- 数据库表默认不开启 RLS，因为所有访问都通过后端 service_role 完成；
  如果你的 Supabase 项目要对外开放其他客户端，请另行配置 RLS 策略。
- 首次部署后请立即把 `APP_PASSWORD` 改成只有你知道的密码。

## 九、后续可扩展

- 对话上下文压缩：消息过长时自动生成摘要，支持真正无限上下文
- 实时资讯：接入 RSS / 新闻 API，让"每日一条"变成真·实时新闻
- 定时提醒：每天固定时间推送一条今日资讯（配合自动化）
- 多端推送：接入 Telegram / 企业微信机器人
- 目标仪表盘：把 2027 春节存 1.5 万、30 岁净资产 100 万拆成进度看板
