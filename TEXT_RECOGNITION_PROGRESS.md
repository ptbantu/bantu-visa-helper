# 文本识别进度文档

## 项目概述
Bantu 签证助手 - 印尼签证管理系统的文本识别模块

## 当前状态：已完成

### 文本识别方案演进

#### 第一阶段：Qwen 图片识别（初始方案）
- **状态**：✅ 已实现
- **方法**：使用 Qwen 进行图片识别
- **优点**：
  - 准确率高
  - 支持多语言（中文、英文、印尼文）
  - 无需额外系统依赖
- **缺点**：
  - 需要 API 调用
  - 有成本

#### 第二阶段：pdf-parse 本地 PDF 解析
- **状态**：❌ 已放弃
- **原因**：
  - 在 Next.js 中导入问题
  - 导出方式不兼容
  - 无法正确加载模块

#### 第三阶段：Tesseract.js OCR
- **状态**：❌ 已放弃
- **原因**：
  - 在 Next.js 生产构建中找不到 worker 脚本
  - 模块加载错误：`Cannot find module '/home/bantu/dev/bantu-visa-helper/.next/worker-script/node/index.js'`
  - 兼容性问题无法解决

#### 第四阶段：Qwen 图片识别（最终方案）
- **状态**：✅ 已实现并验证
- **方法**：
  1. PDF → GraphicsMagick 转图片
  2. 图片 → Qwen 识别文本
  3. 文本 → ITK 解析器提取字段
- **优点**：
  - 稳定可靠
  - 准确率高
  - 支持多语言
  - 无兼容性问题

### 系统依赖

#### 已安装
- ✅ GraphicsMagick 1.3.38 - PDF 转图片
- ✅ Ghostscript 9.54.0 - PDF 处理支持
- ✅ Node.js 20.19.6 - 运行环境
- ✅ npm 依赖：
  - tesseract.js（已安装但禁用）
  - pdf-parse（已安装但禁用）
  - Qwen API（通过环境变量配置）

### 工作流程

```
邮件拉取
  ↓
下载 PDF 附件
  ↓
上传到 OSS
  ↓
创建处理日志
  ↓
尝试 ITK 本地解析（如果失败继续）
  ↓
PDF → 转图片（GraphicsMagick）
  ↓
图片 → Qwen 识别文本
  ↓
文本 → ITK 解析器提取字段
  ↓
保存到数据库
```

### 关键文件

| 文件 | 功能 | 状态 |
|------|------|------|
| `src/lib/email-service.ts` | 邮件处理和 PDF 解析 | ✅ 完成 |
| `src/lib/itk-parser.ts` | ITK 文档解析 | ✅ 完成 |
| `src/lib/ocr-service.ts` | OCR 服务（已禁用） | ⚠️ 禁用 |
| `src/lib/pdf-to-image.ts` | PDF 转图片 | ✅ 完成 |
| `src/lib/email-scheduler.ts` | 邮件定时拉取 | ✅ 完成 |
| `src/lib/reminder-service.ts` | 提醒查询服务 | ✅ 完成 |

### 提取的字段

#### 证件状态类
- permit_number - 许可编号
- expiry_date - 居留许可有效期
- stay_index - 居留许可索引代码
- document_type - 许可全称

#### 持有人身份类
- full_name - 全名
- place_of_birth - 出生地
- passport_number - 护照号码
- passport_expiry - 护照过期日期
- nationality - 国籍
- gender - 性别

#### 居留细节类
- address - 在印尼的登记住址
- activity - 准许从事的活动
- occupation - 职业/职位
- guarantor - 担保人

#### 签发与机关类
- ministry_name - 部门名称
- issuing_office - 签发办公室
- issuing_date - 签发日期
- issuing_location - 签发地点
- office_address - 办公地址

### 容错处理

- ✅ 缺失字段不报错
- ✅ 日期格式自动转换为 YYYY-MM-DD
- ✅ 支持多种关键字匹配（中英文）
- ✅ 非 ITK 文档标记为 SKIPPED
- ✅ EVISA 文档标记为 SKIPPED
- ✅ 解析失败标记为 FAILED

### 数据库更新

#### Customer 表新增字段
- place_of_birth - 出生地
- passport_expiry - 护照过期日期
- nationality - 国籍
- gender - 性别
- address - 地址
- activity - 活动
- occupation - 职业
- guarantor - 担保人
- ministry_name - 部门名称
- issuing_office - 签发办公室
- issuing_date - 签发日期
- issuing_location - 签发地点
- office_address - 办公地址

### 环境变量配置

```env
# Gmail IMAP 配置
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
EMAIL_ACCOUNT=lianpeng523@gmail.com
EMAIL_PASSWORD=fjed riny vqnc xfqo
EMAIL_CHECK_INTERVAL_SECONDS=300

# Qwen API 配置
DASHSCOPE_API_KEY=your_dashscope_api_key

# 数据库配置
DATABASE_URL=postgresql://postgres:BantuCRM123%40@db.bzdelpmcewjdvmgyafux.supabase.co:5432/postgres
```

### 已解决的问题

1. ✅ PDF 文本提取失败 → 改用 Qwen 图片识别
2. ✅ Tesseract.js 兼容性问题 → 禁用并改用 Qwen
3. ✅ pdf-parse 导入错误 → 移除依赖
4. ✅ GraphicsMagick 缺失 → 已安装
5. ✅ Ghostscript 缺失 → 已安装
6. ✅ 邮件过滤器配置 → 已实现
7. ✅ 邮件去重处理 → 已实现
8. ✅ 临时文件管理 → 已实现
9. ✅ 数据库字段扩展 → 已完成

### 测试状态

- ✅ 邮件拉取功能 - 正常工作
- ✅ PDF 上传到 OSS - 正常工作
- ✅ 图片转换 - 正常工作
- ✅ Qwen 识别 - 正常工作
- ✅ ITK 解析 - 正常工作
- ✅ 数据库保存 - 正常工作

### 下一步计划

- [ ] 性能优化（批量处理）
- [ ] 识别准确率提升
- [ ] 错误恢复机制
- [ ] 监控和告警系统
- [ ] 用户界面改进

---

**最后更新**：2026-03-14
**状态**：生产就绪 ✅
