# WeChat企微通知功能使用指南

## 功能概述

Bantu签证助手现已支持WeChat企业微信通知功能，可以自动或手动发送签证过期提醒到企业微信群组。

### 主要特性

- ✅ 每天早上9:00 AM自动发送提醒
- ✅ 支持手动立即发送通知
- ✅ 三阶段分级通知（5天、3天、1天）
- ✅ Markdown格式美化消息
- ✅ 详细的签证信息展示

---

## 快速开始

### 1. 获取企业微信Webhook URL

#### 步骤1：登录企业微信管理后台
- 访问 https://work.weixin.qq.com/
- 使用企业微信账号登录

#### 步骤2：创建机器人
1. 进入"应用与集成" → "应用" → "机器人"
2. 点击"创建机器人"
3. 输入机器人名称（如"签证提醒机器人"）
4. 选择要发送消息的群组
5. 点击"创建"

#### 步骤3：复制Webhook URL
- 在机器人详情页面找到"Webhook URL"
- 复制完整的URL，格式如下：
  ```
  https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_WEBHOOK_KEY
  ```

### 2. 配置环境变量

在 `.env.local` 或 `docker-compose.yml` 中添加：

```env
WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_WEBHOOK_KEY
```

### 3. 重启应用

```bash
npm run dev
# 或
docker-compose restart
```

---

## 使用方式

### 自动发送（每天9:00 AM）

应用启动后，系统会自动在每天早上9:00 AM执行以下操作：

1. 查询所有启用提醒的签证
2. 按剩余天数分为三个阶段
3. 分别发送三个阶段的通知到企业微信群组

**日志示例**:
```
[提醒任务] 启动定时任务，下次执行时间: 2026-03-15 09:00:00
[提醒任务] 执行时间: 2026-03-15 09:00:00
[提醒任务] 阶段一(5天): 3条
[提醒任务] 阶段二(3天): 1条
[提醒任务] 阶段三(1天): 0条
[提醒任务] 阶段一通知: 成功发送3条签证过期提醒
[提醒任务] 阶段二通知: 成功发送1条签证过期提醒
[提醒任务] 阶段三通知: 没有需要通知的签证
```

### 手动发送

在Reminders页面点击"企微通知"按钮，可以立即发送当前的所有阶段通知。

**操作步骤**:
1. 打开应用，进入"提醒"页面
2. 点击"企微通知"按钮（绿色，带发送图标）
3. 等待通知发送完成
4. 查看企业微信群组中的消息

---

## 通知内容示例

### 阶段一：5天内过期（正常提醒）

```
📋 签证即将过期提醒 - 5天内

以下签证将在5天内过期，请及时处理

---

1. 张三
- 护照号: `A12345678`
- 签证类型: B211A
- 到期日期: 2026-03-20
- 剩余天数: 5天

2. 李四
- 护照号: `B87654321`
- 签证类型: C31x
- 到期日期: 2026-03-21
- 剩余天数: 4天

---

⏰ 发送时间: 2026-03-15 09:00:00
```

### 阶段二：3天内过期（紧急提醒）

```
🔴 签证紧急提醒 - 3天内

以下签证将在3天内过期，请立即处理

---

1. 王五
- 护照号: `C11111111`
- 签证类型: B211A
- 到期日期: 2026-03-17
- 剩余天数: 2天

---

⏰ 发送时间: 2026-03-15 09:00:00
```

### 阶段三：1天内过期（紧急到期）

```
🔥 签证紧急到期 - 1天内

以下签证将在1天内过期，请立即处理！

---

1. 赵六
- 护照号: `D22222222`
- 签证类型: C31x
- 到期日期: 2026-03-16
- 剩余天数: 1天

---

⏰ 发送时间: 2026-03-15 09:00:00
```

---

## API端点

### 手动触发通知

**请求**:
```bash
POST /api/reminders/wechat
```

**响应示例**:
```json
{
  "success": true,
  "message": "提醒任务已执行",
  "details": {
    "stage1": {
      "success": true,
      "message": "成功发送3条签证过期提醒"
    },
    "stage2": {
      "success": true,
      "message": "成功发送1条签证过期提醒"
    },
    "stage3": {
      "success": true,
      "message": "没有需要通知的签证"
    },
    "stats": {
      "stage1Count": 3,
      "stage2Count": 1,
      "stage3Count": 0
    }
  }
}
```

---

## 故障排查

### 问题1：通知未发送

**症状**: 点击"企微通知"按钮后没有收到消息

**解决方案**:
1. 检查`WECHAT_WEBHOOK_URL`是否正确配置
   ```bash
   echo $WECHAT_WEBHOOK_URL
   ```

2. 检查Webhook URL是否过期
   - 登录企业微信管理后台
   - 验证机器人是否仍然存在
   - 重新复制Webhook URL

3. 查看服务器日志
   ```bash
   docker-compose logs app | grep "提醒任务"
   ```

### 问题2：定时任务未执行

**症状**: 每天9:00 AM没有自动发送通知

**解决方案**:
1. 检查应用是否正常运行
   ```bash
   docker-compose ps
   ```

2. 查看应用日志
   ```bash
   docker-compose logs app | grep "提醒任务"
   ```

3. 检查`WECHAT_WEBHOOK_URL`是否配置
   - 如果未配置，定时任务会被跳过

### 问题3：通知格式错误

**症状**: 企业微信中收到的消息格式混乱

**解决方案**:
1. 确保Webhook URL指向正确的企业微信机器人
2. 检查网络连接
3. 重新创建机器人并更新Webhook URL

---

## 高级配置

### 修改通知时间

编辑 `src/lib/reminder-scheduler.ts`，修改 `getTimeUntilNextNine()` 函数：

```typescript
// 修改为10:00 AM
next.setHours(10, 0, 0, 0);
```

### 自定义通知模板

编辑 `src/lib/wechat-service.ts`，修改 `generateNotificationMarkdown()` 函数中的模板内容。

### 添加更多通知阶段

在 `src/lib/reminder-service.ts` 中修改 `getReminderStage()` 函数，添加新的阶段逻辑。

---

## 相关文件

- `src/lib/wechat-service.ts` - WeChat服务集成
- `src/lib/reminder-scheduler.ts` - 定时任务调度
- `app/api/reminders/wechat/route.ts` - API端点
- `app/reminders/page.tsx` - UI界面
- `WECHAT_NOTIFICATION_TEMPLATE.md` - 通知模板文档

---

## 最后更新

- **日期**: 2026-03-14
- **版本**: 1.0
- **状态**: 生产就绪 ✅
