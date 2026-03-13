# Cron Job 环境变量配置

## 邮件配置

```env
# 企业微信邮箱账号
EMAIL_ACCOUNT=admin@bantuqifu.com

# 邮箱密码（建议使用应用专用密码）
EMAIL_PASSWORD=your_email_password

# IMAP 服务器配置
IMAP_HOST=imap.qq.com
IMAP_PORT=993
```

## 阿里云 DashScope 配置

```env
# 阿里云 DashScope API Key
DASHSCOPE_API_KEY=sk-your_dashscope_api_key
```

## Cron 安全配置

```env
# Cron 密钥（用于验证请求来源）
CRON_SECRET=your_secret_cron_key
```

## 使用示例

### 手动触发 Cron Job

```bash
# 使用 curl
curl -X POST http://localhost:8081/api/cron/fetch-emails \
  -H "x-cron-secret: your_secret_cron_key"

# 使用 fetch
fetch('http://localhost:8081/api/cron/fetch-emails', {
  method: 'POST',
  headers: {
    'x-cron-secret': 'your_secret_cron_key'
  }
})
```

### 配置定时任务

#### Vercel Cron Jobs

在 `vercel.json` 中配置：

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-emails",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

#### 使用 EasyCron 或其他外部服务

```
URL: https://your-domain.com/api/cron/fetch-emails
Method: POST
Headers: x-cron-secret: your_secret_cron_key
Schedule: 每 6 小时执行一次
```

#### 本地开发测试

```bash
# 使用 node-cron
npm install node-cron

# 在 lib/cron.ts 中配置
import cron from 'node-cron';

cron.schedule('0 */6 * * *', async () => {
  await fetch('http://localhost:8081/api/cron/fetch-emails', {
    method: 'POST',
    headers: {
      'x-cron-secret': process.env.CRON_SECRET || ''
    }
  });
});
```

## 工作流说明

1. **邮件连接**: 使用 IMAP 连接企业微信邮箱
2. **获取未读邮件**: 搜索 UNSEEN 标记的邮件
3. **提取附件**: 从邮件中提取所有图片附件
4. **AI 解析**: 调用阿里云 Qwen-VL-Max 模型解析图片
5. **数据清洗**: 移除 JSON 包裹符号，验证数据格式
6. **去重校验**: 检查 passport_no + expiry_date 组合是否已存在
7. **数据入库**: 新记录写入 PostgreSQL，重复记录跳过

## 错误处理

- 单个邮件处理失败不会影响其他邮件
- 单个附件解析失败不会影响其他附件
- 所有错误都会被记录到控制台
- API 返回 500 错误时会包含错误信息

## 日志输出示例

```
=== 开始执行邮件抓取 Cron Job ===
时间: 2026-03-13T10:30:00.000Z
找到 3 封未读邮件
✓ 成功创建签证记录: 张三 (E12345678)
记录已存在 (passport_no: E87654321, expiry_date: 2026-12-31)，跳过
=== 邮件抓取完成，共处理 1 条记录 ===
```
