# DeepSeek API 配置指南

## ✅ 当前状态

- **API 密钥**: 已配置并验证有效 ✅
- **模型**: deepseek-vision（用于图片识别）
- **功能**: 签证文字识别和信息提取

---

## 配置信息

### 环境变量

```env
DEEPSEEK_API_KEY=sk-b08a1e736bfb45ba8b4968cdad6d0a89
```

### API 端点

```
https://api.deepseek.com/chat/completions
```

### 支持的模型

- `deepseek-chat` - 文本对话
- `deepseek-vision` - 图片识别和分析

---

## 工作流程

### PDF 处理流程

```
PDF 文件
  ↓
[1] 上传到 OSS
  ↓
[2] 创建处理日志
  ↓
[3] PDF 转图片（GraphicsMagick）
  ↓
[4] 图片转 Base64
  ↓
[5] 调用 DeepSeek Vision API
  ↓
[6] 提取签证信息（JSON）
  ↓
[7] 保存到数据库
```

### 提取的字段

- `customer_name` - 客户姓名
- `passport_no` - 护照号码
- `visa_type` - 签证类型
- `expiry_date` - 到期日期（YYYY-MM-DD）
- `entry_date` - 入境日期（YYYY-MM-DD，可选）

---

## 测试

### 验证 API 密钥

```bash
DEEPSEEK_API_KEY=sk-b08a1e736bfb45ba8b4968cdad6d0a89 node test-deepseek-api.js
```

**预期输出**:
```
✅ API 密钥有效！
📝 响应: API密钥有效
```

### 测试完整流程

1. **启动应用**
   ```bash
   npm run dev
   ```

2. **发送包含 PDF 的邮件**
   - 发送到配置的邮箱
   - 邮件应包含签证 PDF 附件

3. **查看处理日志**
   - 访问 http://localhost:8081/logs
   - 查看 PDF 处理状态

---

## 故障排查

### 问题 1: 401 Unauthorized

**症状**: API 返回 401 错误

**解决方案**:
1. 检查 API 密钥是否正确
2. 确保密钥没有过期
3. 验证密钥有正确的权限

### 问题 2: 识别失败

**症状**: PDF 处理失败，无法提取信息

**解决方案**:
1. 检查 PDF 是否清晰
2. 确保 PDF 包含签证信息
3. 查看应用日志获取详细错误信息

### 问题 3: 超时错误

**症状**: API 请求超时

**解决方案**:
1. 检查网络连接
2. 尝试重新发送邮件
3. 检查 DeepSeek API 服务状态

---

## 性能优化

### 图片质量

- PDF 转图片时使用 200 DPI
- 图片大小限制在 1024x1024
- 支持 PNG 格式

### API 调用

- 温度设置: 0.3（更稳定的输出）
- 最大 token: 1024
- 超时时间: 30 秒

---

## 相关文件

- `src/lib/email-service.ts` - 邮件处理和 PDF 识别
- `src/lib/pdf-to-image.ts` - PDF 转图片
- `test-deepseek-api.js` - API 测试脚本
- `.env` - 环境变量配置

---

## 最后更新

- **日期**: 2026-03-14
- **版本**: 1.0
- **状态**: ✅ 生产就绪
