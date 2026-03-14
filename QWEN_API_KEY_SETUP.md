# Qwen API 密钥配置指南

## 问题诊断

当前收到的错误：
```
401 Unauthorized
Incorrect API key provided
```

这表示提供的API密钥无效或已过期。

---

## 获取有效的 Qwen API 密钥

### 步骤 1：登录阿里云控制台

1. 访问 https://www.aliyun.com/
2. 使用阿里云账号登录
3. 进入控制台

### 步骤 2：进入 DashScope 服务

1. 在控制台搜索 "DashScope" 或 "模型服务"
2. 点击进入 DashScope 服务
3. 选择 "API-KEY 管理"

### 步骤 3：创建或查看 API 密钥

1. 点击 "创建新的 API-KEY"
2. 选择应用场景（选择 "通用" 或 "文本生成"）
3. 复制生成的 API 密钥
4. **重要**: 妥善保管密钥，不要泄露

### 步骤 4：配置到项目

将获取的 API 密钥添加到 `.env` 文件：

```env
QWEN_VL_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 验证 API 密钥

运行测试脚本验证密钥是否有效：

```bash
QWEN_VL_API_KEY=your_api_key node test-qwen-api.js
```

如果输出 `✅ API 密钥有效！`，说明配置正确。

---

## 常见问题

### Q: 密钥格式是什么？
A: 密钥通常以 `sk-` 开头，后跟32个字符的十六进制字符串。

### Q: 密钥在哪里可以找到？
A: 登录阿里云控制台 → DashScope → API-KEY 管理

### Q: 密钥过期了怎么办？
A: 在 DashScope 控制台重新生成新的密钥

### Q: 如何确保密钥有正确的权限？
A: 确保密钥有以下权限：
- 文本生成（Text Generation）
- 视觉理解（Vision Understanding）

### Q: 为什么还是 401 错误？
A: 检查以下几点：
1. 密钥是否正确复制（没有多余空格）
2. 密钥是否已过期
3. 密钥是否有正确的权限
4. 是否使用了正确的 API 端点

---

## 测试步骤

1. **获取新的 API 密钥**
   - 登录阿里云控制台
   - 进入 DashScope
   - 创建或复制现有的 API 密钥

2. **更新 .env 文件**
   ```bash
   # 编辑 .env 文件
   nano .env

   # 找到这两行并更新为新的密钥
   QWEN_VL_API_KEY=sk-新密钥
   DASHSCOPE_API_KEY=sk-新密钥
   ```

3. **测试密钥**
   ```bash
   QWEN_VL_API_KEY=sk-新密钥 node test-qwen-api.js
   ```

4. **重启应用**
   ```bash
   npm run dev
   ```

---

## 相关链接

- [阿里云 DashScope 文档](https://help.aliyun.com/zh/model-studio/)
- [API 密钥管理](https://dashscope.console.aliyun.com/api-key)
- [错误代码参考](https://help.aliyun.com/zh/model-studio/error-code)

---

**最后更新**: 2026-03-14
