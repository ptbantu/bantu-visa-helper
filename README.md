# 🎫 Bantu 签证助手 (Bantu Visa Assistant)

<div align="center">
  <h3>印尼签证管理系统 | Indonesia Visa Management System</h3>
  <p>一站式签证记录、提醒和配置管理平台</p>
</div>

---

## 📋 项目概述

Bantu 签证助手是一个全栈 Next.js 应用，专为签证管理人员设计。支持多种印尼签证类型的记录、追踪和提醒管理。

**核心功能：**
- 📊 签证记录管理（B211A、ITAS、VOA 等 38 种签证类型）
- ⏰ 智能提醒系统（5-3-1 阶段提醒）
- 📧 邮件配置和自动化
- 🤖 企业微信和语音机器人集成
- 📝 系统日志和审计追踪

---

## 🚀 快速开始

### 前置要求
- Node.js 18+
- PostgreSQL (Supabase)
- Docker & Docker Compose (用于生产部署)

### 本地开发

1. **克隆仓库**
   ```bash
   git clone git@github.com:ptbantu/bantu-visa-helper.git
   cd bantu-visa-helper
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   # 复制 .env.local 并填入 Supabase 连接字符串
   cp .env.example .env.local
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   - 主页: http://localhost:8081
   - 日志: http://localhost:8081/logs
   - 设置: http://localhost:8081/settings
   - 提醒: http://localhost:8081/reminders

### 生产部署

#### Docker Compose 部署

1. **配置环境变量**
   ```bash
   # 编辑 docker-compose.yml，设置 DATABASE_URL
   ```

2. **启动应用**
   ```bash
   docker compose up -d
   ```

3. **访问应用**
   - HTTP: http://www.bantuqifu.online/visa
   - HTTPS: https://www.bantuqifu.online/visa

#### 获取 SSL 证书

```bash
# 使用 Let's Encrypt 获取证书
docker run --rm -p 80:80 -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly --standalone \
  -d www.bantuqifu.online -d bantuqifu.online \
  --non-interactive --agree-tos --email admin@bantuqifu.online
```

---

## 📊 技术栈

- **前端**: React 19 + Next.js 16 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL (Supabase) + Prisma 6 ORM
- **国际化**: 中文 + 印尼文
- **部署**: Docker + Docker Compose + nginx + Let's Encrypt

### 生产架构

```
┌─────────────────────────────────────────────────────┐
│                    互联网                            │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS (443)
                     ▼
        ┌────────────────────────┐
        │   nginx (host:80/443)  │
        │  - SSL/TLS 终止        │
        │  - 反向代理            │
        │  - 路由 /visa          │
        └────────────┬───────────┘
                     │ HTTP (3001)
                     ▼
        ┌────────────────────────┐
        │  Next.js App (3001)    │
        │  - React 前端          │
        │  - API Routes          │
        │  - Prisma ORM          │
        └────────────┬───────────┘
                     │ TCP (5432)
                     ▼
        ┌────────────────────────┐
        │  Supabase PostgreSQL   │
        │  - 数据存储            │
        │  - 业务逻辑            │
        └────────────────────────┘
```

---

## 📁 项目结构

```
bantu-visa-helper/
├── app/
│   ├── api/                    # API 端点
│   │   ├── logs/              # 日志 API
│   │   ├── settings/          # 设置 API
│   │   ├── reminders/         # 提醒 API
│   │   ├── visas/             # 签证 API
│   │   └── visa-types/        # 签证类型 API
│   ├── logs/                  # 日志页面
│   ├── settings/              # 设置页面
│   ├── reminders/             # 提醒页面
│   └── page.tsx               # 仪表板
├── src/
│   ├── components/            # React 组件
│   ├── contexts/              # 上下文 (语言)
│   ├── lib/                   # 工具函数
│   ├── types/                 # TypeScript 类型
│   └── data/                  # Mock 数据
├── prisma/
│   └── schema.prisma          # 数据库 schema
└── scripts/
    ├── init-db.js             # 初始化数据库
    └── init-visa-types.js     # 初始化签证类型
```

---

## 🔌 API 端点

### 日志系统
- `GET /api/logs` - 获取日志列表（支持过滤、搜索）
- `POST /api/logs` - 创建日志
- `GET /api/logs/stats` - 获取日志统计

### 设置管理
- `GET /api/settings` - 获取应用设置
- `PUT /api/settings` - 更新应用设置
- `POST /api/settings/test-email` - 测试邮箱连接
- `POST /api/settings/test-webhook` - 测试企业微信 Webhook

### 提醒系统
- `GET /api/reminders` - 获取提醒列表
- `POST /api/reminders` - 手动生成提醒
- `PUT /api/reminders/[id]` - 更新提醒

### 签证管理
- `GET /api/visas` - 获取签证列表
- `POST /api/visas` - 创建签证
- `GET /api/visa-types` - 获取签证类型库

---

## 📊 数据库表

| 表名 | 说明 | 记录数 |
|------|------|--------|
| VisaRecord | 签证记录 | 8 |
| SystemLog | 系统日志 | 5 |
| Reminder | 提醒记录 | 3 |
| AppSettings | 应用设置 | 1 |
| VisaType | 签证类型库 | 38 |

---

## 🎯 主要功能

### 📊 仪表板
- 签证统计（B211A vs ITAS）
- 快速操作按钮
- 最近活动

### 📝 日志系统
- 实时日志流
- 按级别和模块过滤
- 关键词搜索
- 自动刷新（10 秒）

### ⚙️ 设置管理
- 邮件配置（账号、密码、过滤器、频率）
- 企业微信配置（Webhook、模板预览）
- 语音机器人配置（API Key、时间段、接收人）
- 实时测试功能

### ⏰ 提醒系统
- 5-3-1 阶段提醒
- 按阶段筛选
- 手动刷新生成
- 标记已确认

---

## 🔐 环境变量

```env
# 数据库
DATABASE_URL=postgresql://user:password@host:5432/database

# API Keys
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret

# 可选
OPENAI_API_KEY=your_openai_api_key
COMPOSIO_API_KEY=your_composio_api_key
```

---

## 📦 构建和部署

### 生产构建
```bash
npm run build
npm start
```

### Docker 部署

**使用 Docker Compose（推荐）**
```bash
# 启动应用
docker compose up -d

# 查看日志
docker compose logs -f visa-app

# 停止应用
docker compose down
```

**配置说明**
- 应用运行在容器内的 3001 端口
- nginx 反向代理在 80/443 端口
- 使用 host 网络模式以支持外部数据库连接
- 支持 HTTP 自动重定向到 HTTPS

**环境变量**
```yaml
# docker-compose.yml
environment:
  - NODE_ENV=production
  - DATABASE_URL=postgresql://user:password@host:5432/database
```

---

## 🧪 测试

### 运行 TypeScript 检查
```bash
npm run lint
```

### 测试 API 端点
```bash
# 获取签证类型
curl http://localhost:8081/api/visa-types

# 获取日志
curl http://localhost:8081/api/logs?limit=5

# 获取设置
curl http://localhost:8081/api/settings
```

---

## 📚 文档

- [API 迁移指南](./API_MIGRATION_GUIDE.md)
- [实施总结](./MIGRATION_SUMMARY.md)
- [完成报告](./IMPLEMENTATION_COMPLETE.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 📞 联系方式

- 项目主页: https://github.com/ptbantu/bantu-visa-helper
- 问题反馈: https://github.com/ptbantu/bantu-visa-helper/issues

---

**Made with ❤️ for Bantu Visa Management**
