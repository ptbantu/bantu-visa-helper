# PDF 图片识别流程文档

## 概述

本文档描述了邮件中 PDF 附件的智能识别流程，包括 PDF 转图片、Qwen 图片识别、以及降级到文本识别的完整处理链。

## 架构流程

```
邮件附件 (PDF)
    ↓
[1] 上传到 OSS
    ↓
[2] 创建处理日志 (PENDING)
    ↓
[3] 智能识别流程
    ├─→ 尝试图片识别
    │   ├─→ PDF 转图片 (pdf2pic)
    │   ├─→ 调用 Qwen 图片识别 API
    │   └─→ 解析 JSON 结果
    │
    └─→ 如果图片识别失败，降级到文本识别
        ├─→ 提取 PDF 文本 (pdf-parse)
        ├─→ 调用 Qwen 文本识别 API
        └─→ 解析 JSON 结果
    ↓
[4] 数据暂存到日志
    ↓
[5] 检查重复记录
    ↓
[6] 业务入库 (Customer + VisaRecord)
    ↓
[7] 更新日志状态 (SUCCESS/FAILED)
```

## 核心函数

### 1. `smartParseVisaData(pdfBuffer, filename)`

**位置**: `app/api/cron/fetch-emails/route.ts:192-204`

**功能**: 智能识别流程的入口，优先使用图片识别，失败则降级到文本识别

**参数**:
- `pdfBuffer`: PDF 文件的 Buffer
- `filename`: PDF 文件名

**返回**: `ParsedVisaData | null`

**流程**:
```typescript
try {
  // 1. 尝试图片识别
  const imageBuffers = await convertPdfToImages(pdfBuffer, filename);
  return await parseWithQwenImage(imageBuffers);
} catch (imageError) {
  // 2. 降级到文本识别
  const pdfText = await extractTextFromPDF(pdfBuffer);
  return await parseWithQwen(pdfText);
}
```

### 2. `convertPdfToImages(pdfBuffer, filename)`

**位置**: `src/lib/pdf-to-image.ts:12-77`

**功能**: 将 PDF 转换为 PNG 图片数组

**参数**:
- `pdfBuffer`: PDF 文件的 Buffer
- `filename`: PDF 文件名

**返回**: `Buffer[]` - PNG 图片 Buffer 数组

**配置**:
- DPI: 200
- 格式: PNG
- 分辨率: 1024x1024
- 页面: 所有页面 (-1)

**临时文件处理**:
- 创建临时 PDF 文件
- 转换后自动清理临时文件和输出目录

### 3. `parseWithQwenImage(imageBuffers)`

**位置**: `app/api/cron/fetch-emails/route.ts:119-187`

**功能**: 使用 Qwen 图片识别 API 解析签证信息

**参数**:
- `imageBuffers`: PNG 图片 Buffer 数组

**返回**: `ParsedVisaData | null`

**API 调用**:
- 端点: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- 模型: `qwen-max`
- 温度: 0.3
- 最大 Token: 1024

**消息格式**:
```json
{
  "model": "qwen-max",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "提示词..." },
        { "type": "image", "image": "base64编码的图片1" },
        { "type": "image", "image": "base64编码的图片2" },
        ...
      ]
    }
  ]
}
```

### 4. `parseWithQwen(pdfText)`

**位置**: `app/api/cron/fetch-emails/route.ts:59-114`

**功能**: 使用 Qwen 文本识别 API 解析签证信息（降级方案）

**参数**:
- `pdfText`: 从 PDF 提取的文本

**返回**: `ParsedVisaData | null`

## 提取的数据格式

```typescript
interface ParsedVisaData {
  customer_name: string;      // 客户姓名
  passport_no: string;        // 护照号码
  visa_type: string;          // 签证类型
  expiry_date: string;        // 到期日期 (YYYY-MM-DD)
  entry_date: string | null;  // 入境日期 (YYYY-MM-DD)
}
```

## 日志记录

处理过程中的所有步骤都会记录到 `EmailProcessLog` 表：

```typescript
{
  id: string;                    // 日志 ID
  messageId: string;             // 邮件 Message-ID
  pdfKey: string;                // OSS 文件 Key
  pdfFilename: string;           // PDF 文件名
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  extractedData: ParsedVisaData; // 提取的数据
  errorMessage?: string;         // 错误信息
  processedAt?: Date;            // 处理完成时间
}
```

## 错误处理

### 图片识别失败的处理

当 PDF 转图片或 Qwen 图片识别失败时：

1. 记录警告日志
2. 自动降级到文本识别
3. 如果文本识别也失败，则标记为 FAILED

### 数据验证

提取的数据必须通过 `validateVisaData()` 验证：

```typescript
function validateVisaData(data: any): data is ParsedVisaData {
  return (
    typeof data.customer_name === 'string' &&
    typeof data.passport_no === 'string' &&
    typeof data.visa_type === 'string' &&
    typeof data.expiry_date === 'string' &&
    (data.entry_date === null || typeof data.entry_date === 'string')
  );
}
```

## 环境变量

```bash
# Qwen API 密钥
DASHSCOPE_API_KEY=your_api_key

# OSS 配置
OSS_ENDPOINT=oss-ap-southeast-5.aliyuncs.com
OSS_BUCKET_NAME=bantuqifu-dev
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret_key

# IMAP 邮件配置
IMAP_HOST=imap.qq.com
IMAP_PORT=993
EMAIL_ACCOUNT=your_email@example.com
EMAIL_PASSWORD=your_password
```

## 系统依赖

PDF 转图片功能需要以下系统工具：

```bash
# Ubuntu/Debian
apt-get install imagemagick ghostscript

# CentOS/RHEL
yum install ImageMagick ghostscript

# macOS
brew install imagemagick ghostscript
```

## 性能优化

1. **并行处理**: 多个邮件的 PDF 附件可以并行处理
2. **图片压缩**: 转换后的图片为 1024x1024，已优化大小
3. **临时文件清理**: 自动清理临时文件，避免磁盘占用
4. **降级策略**: 图片识别失败自动降级，提高成功率

## 测试

运行测试脚本验证 PDF 转图片功能：

```bash
npx tsx scripts/test-pdf-to-image.ts
```

## 故障排查

### 问题: "PDF 转图片失败"

**原因**: 系统未安装 ImageMagick 或 Ghostscript

**解决**:
```bash
apt-get install imagemagick ghostscript
```

### 问题: "Qwen API 错误: 401"

**原因**: DASHSCOPE_API_KEY 未配置或无效

**解决**: 检查 `.env` 文件中的 API 密钥

### 问题: "解析的数据格式不符合要求"

**原因**: Qwen 返回的 JSON 格式不符合预期

**解决**: 检查 Qwen 的系统提示词，确保返回格式正确

## 相关文件

- `app/api/cron/fetch-emails/route.ts` - 邮件处理主逻辑
- `src/lib/pdf-to-image.ts` - PDF 转图片工具
- `src/lib/oss.ts` - OSS 文件上传工具
- `prisma/schema.prisma` - 数据库模型
- `scripts/test-pdf-to-image.ts` - 测试脚本
