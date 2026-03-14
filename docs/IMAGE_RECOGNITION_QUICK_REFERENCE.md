# 图片识别快速参考

## 核心流程

```
邮件 PDF 附件
    ↓
[1] 上传 OSS
[2] 创建日志 (PENDING)
[3] 智能识别
    ├─ 图片识别 (优先)
    │  ├─ PDF → 图片
    │  └─ Qwen 图片 API
    └─ 文本识别 (降级)
       ├─ PDF → 文本
       └─ Qwen 文本 API
[4] 数据暂存
[5] 检查重复
[6] 业务入库
[7] 更新日志 (SUCCESS/FAILED)
```

## 关键函数

| 函数 | 位置 | 功能 |
|------|------|------|
| `smartParseVisaData` | fetch-emails:192 | 智能识别入口 |
| `convertPdfToImages` | pdf-to-image:12 | PDF 转图片 |
| `parseWithQwenImage` | fetch-emails:119 | 图片识别 |
| `parseWithQwen` | fetch-emails:59 | 文本识别 |
| `extractTextFromPDF` | fetch-emails:33 | 文本提取 |

## 环境变量

```bash
DASHSCOPE_API_KEY=your_api_key
OSS_ENDPOINT=oss-ap-southeast-5.aliyuncs.com
OSS_BUCKET_NAME=bantuqifu-dev
OSS_ACCESS_KEY_ID=your_key
OSS_ACCESS_KEY_SECRET=your_secret
```

## 系统依赖

```bash
apt-get install imagemagick ghostscript
```

## 提取的数据

```json
{
  "customer_name": "姓名",
  "passport_no": "护照号",
  "visa_type": "签证类型",
  "expiry_date": "2025-12-31",
  "entry_date": "2023-01-15"
}
```

## 日志查询

```sql
-- 查看处理日志
SELECT * FROM EmailProcessLog
WHERE status = 'SUCCESS'
ORDER BY processedAt DESC;

-- 查看失败的处理
SELECT * FROM EmailProcessLog
WHERE status = 'FAILED'
ORDER BY createdAt DESC;
```

## 测试

```bash
# 运行测试脚本
npx tsx scripts/test-pdf-to-image.ts

# 触发 Cron Job
curl -H "x-cron-secret: your_secret" \
  http://localhost:3000/api/cron/fetch-emails
```

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| PDF 转图片失败 | 缺少系统工具 | `apt-get install imagemagick ghostscript` |
| Qwen API 401 | API 密钥无效 | 检查 `.env` 中的 DASHSCOPE_API_KEY |
| 数据格式错误 | JSON 格式不符 | 检查 Qwen 返回的 JSON 格式 |
| 临时文件未清理 | 异常退出 | 手动清理 `/tmp/pdf_images_*` |

## 性能指标

- PDF 转图片: 1-2 秒/页
- Qwen 识别: 2-3 秒
- 图片大小: 50-100KB (1024x1024)
- 内存占用: 自动清理，无泄漏

## 文件清单

```
app/api/cron/fetch-emails/route.ts    ← 邮件处理主逻辑
src/lib/pdf-to-image.ts               ← PDF 转图片工具
src/lib/oss.ts                        ← OSS 上传工具
docs/PDF_IMAGE_RECOGNITION.md         ← 详细文档
docs/IMAGE_RECOGNITION_SUMMARY.md     ← 完善总结
scripts/test-pdf-to-image.ts          ← 测试脚本
```

## 下一步

- [ ] 添加识别质量评分
- [ ] 实现失败重试机制
- [ ] 添加性能监控
- [ ] 缓存已识别结果
- [ ] 并行处理多个邮件
