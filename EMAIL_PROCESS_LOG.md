# 邮件自动入库系统 - 记账式处理流程

## 概述

本系统采用"记账式"处理流程，确保每一条 PDF 的处理状态都被精确追踪。通过 `EmailProcessLog` 表记录每个 PDF 的完整生命周期，实现高可靠性的分布式任务处理。

## 核心流程

### 1. 预记账阶段

当发现邮件中的 PDF 附件时：

```
PDF 发现 → OSS 上传 → 创建 EmailProcessLog 记录 (状态: PENDING)
```

**记录内容：**
- `messageId`: 邮件 ID（用于关联同一邮件的多个 PDF）
- `pdfKey`: OSS 存储路径（格式：`visas/YYYYMMDD/UUID.pdf`）
- `pdfFilename`: 原始文件名
- `status`: PENDING
- `createdAt`: 创建时间

### 2. 核心处理流程

在 Try-Catch 块中执行以下步骤：

```
[2.1] AI 提取
  ↓
[2.2] 数据暂存 (更新 extractedData 字段)
  ↓
[2.3] 业务入库
  ├─ 检查重复 (passport_no + expiry_date)
  ├─ Upsert Customer (使用事务)
  └─ Create VisaRecord (使用事务)
```

**关键特性：**
- 使用 `prisma.$transaction()` 确保 Customer 和 VisaRecord 的原子性
- 重复数据也标记为 SUCCESS（因为数据已在系统中）
- 每一步都有详细的日志输出

### 3. 状态闭环

#### 成功路径 (SUCCESS)

```
处理完成 → 更新 EmailProcessLog
  ├─ status: SUCCESS
  ├─ processedAt: 当前时间
  └─ errorMessage: null
```

#### 失败路径 (FAILED)

```
任何步骤失败 → 捕获异常 → 更新 EmailProcessLog
  ├─ status: FAILED
  ├─ errorMessage: 详细错误信息
  └─ processedAt: null (保留以便重试)
```

**关键逻辑：**
- 设置 `isEmailFullyProcessed = false`
- 邮件保持未读状态
- 下次 Cron 运行时重新处理

### 4. 邮件标记规则

```
检查邮件中所有 PDF 的 EmailProcessLog 记录
  ↓
所有记录都是 SUCCESS?
  ├─ 是 → 标记邮件为已读 (Seen: true)
  └─ 否 → 保持未读状态，等待下次重试
```

## 数据库表结构

### EmailProcessLog

```sql
CREATE TABLE email_process_logs (
  id              UUID PRIMARY KEY,
  messageId       VARCHAR NOT NULL,
  pdfKey          VARCHAR NOT NULL,
  pdfFilename     VARCHAR NOT NULL,

  status          VARCHAR DEFAULT 'PENDING',  -- PENDING | SUCCESS | FAILED
  extractedData   JSONB,                      -- AI 提取的结构化数据
  errorMessage    VARCHAR,                    -- 失败时的错误信息

  processedAt     TIMESTAMP,                  -- 处理完成时间
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP DEFAULT NOW(),

  INDEX (messageId),
  INDEX (status),
  INDEX (createdAt)
);
```

## 日志输出示例

```
=== 开始执行邮件抓取 Cron Job ===
时间: 2026-03-13T10:30:00.000Z
连接到 IMAP 服务器...
✓ IMAP 连接成功
打开收件箱...
✓ 收件箱打开成功，共 100 封邮件
搜索未读邮件...
找到 3 封未读邮件

处理邮件 UID: 1001
找到 2 个 PDF 附件

处理 PDF 附件: visa_001.pdf (UID: 1001)
  [1] 上传 PDF 到 OSS...
  ✓ PDF 上传成功: visas/20260313/abc-123.pdf
  [2] 创建处理日志记录...
  ✓ 日志记录创建成功 (ID: log-001)
  [3] 提取 PDF 文本...
  ✓ 提取文本长度: 5432 字符
  [4] 调用 Qwen 进行数据提取...
  ✓ 解析成功: 张三 (E12345678)
  [5] 暂存提取的数据...
  ✓ 数据暂存成功
  [6] 检查数据库中是否已存在...
  [7] 执行业务入库...
  ✓ 签证记录创建成功
  [8] 更新日志状态为 SUCCESS...
  ✓ 处理完成

处理 PDF 附件: visa_002.pdf (UID: 1001)
  [1] 上传 PDF 到 OSS...
  ✓ PDF 上传成功: visas/20260313/def-456.pdf
  [2] 创建处理日志记录...
  ✓ 日志记录创建成功 (ID: log-002)
  [3] 提取 PDF 文本...
  ✓ 提取文本长度: 4321 字符
  [4] 调用 Qwen 进行数据提取...
  ✓ 解析成功: 李四 (E87654321)
  [5] 暂存提取的数据...
  ✓ 数据暂存成功
  [6] 检查数据库中是否已存在...
  [7] 执行业务入库...
  ✓ 签证记录创建成功
  [8] 更新日志状态为 SUCCESS...
  ✓ 处理完成

标记邮件 UID 1001 为已读...
✓ 邮件 UID 1001 已标记为已读

=== 邮件抓取完成 ===
处理邮件数: 3
成功邮件数: 3
失败邮件数: 0
```

## 错误处理

### 场景 1: OSS 上传失败

```
[1] 上传 PDF 到 OSS...
✗ 处理失败: OSS 连接超时
[9] 更新日志状态为 FAILED...
✓ 失败状态已记录

邮件 UID 1001 中有处理失败的 PDF，保持未读状态以便下次重试
```

**结果：**
- EmailProcessLog: status = FAILED, errorMessage = "OSS 连接超时"
- 邮件保持未读
- 下次 Cron 运行时重新处理

### 场景 2: Qwen API 超时

```
[4] 调用 Qwen 进行数据提取...
✗ 处理失败: Qwen API 错误: 504 Gateway Timeout
[9] 更新日志状态为 FAILED...
✓ 失败状态已记录
```

**结果：**
- EmailProcessLog: status = FAILED, errorMessage = "Qwen API 错误: 504 Gateway Timeout"
- 邮件保持未读
- 下次 Cron 运行时重新处理

### 场景 3: 数据库事务失败

```
[7] 执行业务入库...
✗ 处理失败: Unique constraint violation on (customerId, visaTypeCode, expiry_date)
[9] 更新日志状态为 FAILED...
✓ 失败状态已记录
```

**结果：**
- EmailProcessLog: status = FAILED, errorMessage = "Unique constraint violation..."
- 邮件保持未读
- 下次 Cron 运行时重新处理

## 监控和调试

### 查询处理日志

```bash
# 查询所有失败的记录
curl "http://localhost:3000/api/email-process-logs?status=FAILED"

# 查询特定邮件的所有 PDF 处理记录
curl "http://localhost:3000/api/email-process-logs?messageId=<message-id>"

# 查询待处理的记录
curl "http://localhost:3000/api/email-process-logs?status=PENDING"

# 分页查询
curl "http://localhost:3000/api/email-process-logs?limit=20&offset=0"
```

### 查询统计信息

```bash
# 获取处理统计
curl "http://localhost:3000/api/email-process-logs/stats"

# 响应示例
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 5,
    "success": 140,
    "failed": 5
  }
}
```

## 重试机制

### 自动重试

当 Cron Job 再次运行时：

1. 搜索未读邮件（包括之前失败的邮件）
2. 对每个 PDF 重新执行完整流程
3. 创建新的 EmailProcessLog 记录（或更新现有记录）

### 手动重试

如果需要手动重试失败的 PDF：

```sql
-- 查询失败的记录
SELECT * FROM email_process_logs WHERE status = 'FAILED' ORDER BY createdAt DESC;

-- 重置为 PENDING（下次 Cron 运行时会重新处理）
UPDATE email_process_logs SET status = 'PENDING' WHERE id = '<log-id>';
```

## 性能考虑

### 事务隔离

- 使用 `prisma.$transaction()` 确保 Customer 和 VisaRecord 的原子性
- 避免脏读和幻读
- 支持并发处理多个邮件

### 索引优化

```sql
-- 快速查询特定状态的记录
CREATE INDEX idx_email_process_logs_status ON email_process_logs(status);

-- 快速查询特定邮件的所有 PDF
CREATE INDEX idx_email_process_logs_messageId ON email_process_logs(messageId);

-- 快速查询最近的记录
CREATE INDEX idx_email_process_logs_createdAt ON email_process_logs(createdAt DESC);
```

### 批量处理

- 每次 Cron 运行处理所有未读邮件
- 支持并发处理多个 PDF（顺序执行，避免资源竞争）
- 单个 PDF 失败不影响其他 PDF 的处理

## 故障恢复

### 断网恢复

```
Cron 运行中断网 → 邮件保持未读 → 下次 Cron 运行时重新处理
```

### 数据库连接失败

```
数据库连接失败 → 无法创建/更新 EmailProcessLog → 邮件保持未读 → 下次重试
```

### 部分成功

```
邮件中有 3 个 PDF：
- PDF 1: SUCCESS
- PDF 2: FAILED (API 超时)
- PDF 3: SUCCESS

结果：邮件保持未读，下次重试时只需重新处理 PDF 2
```

## 最佳实践

1. **定期检查失败记录**
   - 监控 FAILED 状态的记录
   - 分析错误原因，优化系统

2. **设置告警**
   - 当失败率超过阈值时告警
   - 当 PENDING 记录堆积时告警

3. **定期清理**
   - 保留 30 天内的所有记录
   - 定期归档历史记录

4. **日志分析**
   - 分析常见错误类型
   - 优化 AI 提取准确率
   - 改进 OSS 上传稳定性
