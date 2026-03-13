# API 迁移完成 - 测试指南

## 📋 实施总结

已完成从 Mock 数据到 Supabase PostgreSQL 的后端 API 迁移，包括五个阶段：

### ✅ 阶段 1：数据库 Schema 扩展
- 更新 Prisma schema，添加了 `SystemLog`、`Reminder`、`AppSettings` 表
- 扩展 `VisaRecord` 模型，添加 `entry_date` 和 `port_of_entry` 字段
- 生成了新的 Prisma 客户端

### ✅ 阶段 2：创建 Logs API
- `GET /api/logs` - 获取日志列表，支持过滤和搜索
- `POST /api/logs` - 创建日志
- `GET /api/logs/stats` - 返回日志统计数据
- 更新 `app/logs/page.tsx` - 从 mock 数据迁移到实时 API

### ✅ 阶段 3：创建 Settings API
- `GET /api/settings` - 获取应用配置
- `PUT /api/settings` - 更新应用配置
- `POST /api/settings/test-email` - 测试邮箱连接
- `POST /api/settings/test-webhook` - 测试企业微信 Webhook
- 更新 `app/settings/page.tsx` - 完整的配置管理界面

### ✅ 阶段 4：创建 Reminders API
- `GET /api/reminders` - 获取提醒列表
- `POST /api/reminders` - 手动触发提醒生成
- `PUT /api/reminders/[id]` - 更新单个提醒
- 完整实现 `app/reminders/page.tsx` - 5-3-1 提醒系统

### ✅ 阶段 5：扩展现有 Visa API
- 更新 `/api/visas/route.ts` - 支持新的字段

---

## 🚀 快速开始

### 1. 初始化数据库

```bash
# 方式 A：使用 Prisma CLI（推荐）
DATABASE_URL="postgresql://postgres:BantuCRM123%40@db.bzdelpmcewjdvmgyafux.supabase.co:5432/postgres" \
npx prisma migrate deploy

# 方式 B：推送 schema（如果没有迁移文件）
DATABASE_URL="postgresql://postgres:BantuCRM123%40@db.bzdelpmcewjdvmgyafux.supabase.co:5432/postgres" \
npx prisma db push --accept-data-loss
```

### 2. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:8081` 启动

---

## 🧪 API 端点测试

### Logs API

**获取日志列表**
```bash
curl http://localhost:8081/api/logs?level=all&module=all&limit=50
```

**获取日志统计**
```bash
curl http://localhost:8081/api/logs/stats
```

**创建日志**
```bash
curl -X POST http://localhost:8081/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "level": "info",
    "module": "Test",
    "message": "测试日志"
  }'
```

### Settings API

**获取设置**
```bash
curl http://localhost:8081/api/settings
```

**更新设置**
```bash
curl -X PUT http://localhost:8081/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "emailConfig": {
      "account": "admin@example.com",
      "password": "newpassword",
      "filter": "@imigrasi.go.id",
      "frequency": 5
    },
    "pushConfig": {
      "wecomWebhook": "https://...",
      "callTime": "working-hours",
      "receiver": "wangshuo"
    }
  }'
```

**测试邮箱连接**
```bash
curl -X POST http://localhost:8081/api/settings/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "account": "test@example.com",
    "password": "testpass"
  }'
```

**测试 Webhook**
```bash
curl -X POST http://localhost:8081/api/settings/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
  }'
```

### Reminders API

**获取提醒列表**
```bash
curl http://localhost:8081/api/reminders?stage=all
```

**手动触发提醒生成**
```bash
curl -X POST http://localhost:8081/api/reminders
```

**更新提醒（标记已确认）**
```bash
curl -X PUT http://localhost:8081/api/reminders/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "is_acknowledged": true
  }'
```

### Visas API

**获取签证列表**
```bash
curl http://localhost:8081/api/visas
```

**创建签证**
```bash
curl -X POST http://localhost:8081/api/visas \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "张三",
    "passport_no": "E12345678",
    "visa_type": "B211A 商务签证",
    "expiry_date": "2026-12-31",
    "is_urgent": false,
    "phone": "+86 13800000000",
    "reminder_enabled": true,
    "entry_date": "2026-01-01",
    "port_of_entry": "CGK"
  }'
```

---

## 📱 前端页面测试

### Logs 页面
- URL: `http://localhost:8081/logs`
- 功能：
  - 显示日志统计卡片（解析邮件、提取签证、推送通知、待处理预警）
  - 搜索和过滤日志
  - 每 10 秒自动刷新

### Settings 页面
- URL: `http://localhost:8081/settings`
- 功能：
  - 配置邮件抓取参数
  - 配置企业微信 Webhook
  - 配置语音机器人
  - 测试邮箱连接和 Webhook

### Reminders 页面
- URL: `http://localhost:8081/reminders`
- 功能：
  - 显示提醒统计（各阶段数量）
  - 按阶段筛选提醒
  - 手动刷新提醒
  - 标记提醒为已确认

---

## 🔧 故障排除

### 数据库连接问题

如果遇到数据库连接错误，检查：

1. **DATABASE_URL 是否正确**
   ```bash
   echo $DATABASE_URL
   ```

2. **Supabase 连接是否有效**
   ```bash
   psql "$DATABASE_URL"
   ```

3. **Prisma 客户端是否已生成**
   ```bash
   npx prisma generate
   ```

### API 返回 500 错误

检查：
1. 服务器日志中的错误信息
2. 数据库是否已初始化
3. 环境变量是否正确设置

---

## 📝 关键文件

### 新建 API 端点
- `/app/api/logs/route.ts`
- `/app/api/logs/stats/route.ts`
- `/app/api/settings/route.ts`
- `/app/api/settings/test-email/route.ts`
- `/app/api/settings/test-webhook/route.ts`
- `/app/api/reminders/route.ts`
- `/app/api/reminders/[id]/route.ts`

### 更新前端页面
- `/app/logs/page.tsx`
- `/app/settings/page.tsx`
- `/app/reminders/page.tsx`

### 数据库配置
- `/prisma/schema.prisma` - 更新的 schema
- `/prisma.config.cjs` - Prisma 7 配置文件

---

## ✨ 下一步

1. **初始化数据库**：运行迁移或 db push
2. **启动服务器**：`npm run dev`
3. **测试 API**：使用上述 curl 命令或 Postman
4. **验证前端**：访问各个页面确保功能正常
5. **配置 Cron Job**：定期触发 `/api/reminders` 生成提醒

---

## 📞 支持

如有问题，请检查：
- 服务器日志
- 数据库连接
- API 响应状态码
- 浏览器控制台错误
