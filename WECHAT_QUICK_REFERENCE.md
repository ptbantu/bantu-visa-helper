# WeChat企微通知功能 - 快速参考

## 🚀 快速开始

### 1. 配置Webhook URL
```env
WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY
```

### 2. 重启应用
```bash
npm run dev
# 或
docker-compose restart
```

### 3. 使用功能
- **自动**: 每天9:00 AM自动发送
- **手动**: Reminders页面点击"企微通知"按钮

---

## 📋 通知阶段

| 阶段 | 天数 | 标题 | 颜色 | 处理建议 |
|------|------|------|------|---------|
| 一 | ≤5天 | 📋 签证即将过期提醒 | 橙色 | 及时处理 |
| 二 | ≤3天 | 🔴 签证紧急提醒 | 红色 | 立即处理 |
| 三 | ≤1天 | 🔥 签证紧急到期 | 深红 | 立即处理！ |

---

## 📁 新增文件

```
src/lib/
├── wechat-service.ts          # WeChat API集成
└── reminder-scheduler.ts      # 定时任务调度

app/api/reminders/
└── wechat/
    └── route.ts               # 手动触发API

文档/
├── WECHAT_SETUP_GUIDE.md      # 设置指南
├── WECHAT_NOTIFICATION_TEMPLATE.md  # 模板说明
└── WECHAT_IMPLEMENTATION_SUMMARY.md  # 实现总结
```

---

## 🔧 修改的文件

- `app/reminders/page.tsx` - 添加企微通知按钮
- `src/lib/background-services.ts` - 初始化定时任务
- `.env.example` - 添加配置示例

---

## 📞 API端点

### 手动触发通知
```bash
POST /api/reminders/wechat
```

**响应**:
```json
{
  "success": true,
  "message": "提醒任务已执行",
  "details": {
    "stage1": { "success": true, "message": "..." },
    "stage2": { "success": true, "message": "..." },
    "stage3": { "success": true, "message": "..." },
    "stats": { "stage1Count": 3, "stage2Count": 1, "stage3Count": 0 }
  }
}
```

---

## 🐛 故障排查

### 通知未发送
- ✓ 检查`WECHAT_WEBHOOK_URL`配置
- ✓ 验证Webhook URL是否过期
- ✓ 查看日志: `docker-compose logs app | grep "提醒任务"`

### 定时任务未执行
- ✓ 检查应用是否运行
- ✓ 确认`WECHAT_WEBHOOK_URL`已配置
- ✓ 查看应用启动日志

---

## 📚 详细文档

- **WECHAT_SETUP_GUIDE.md** - 完整的设置和使用指南
- **WECHAT_NOTIFICATION_TEMPLATE.md** - 三个阶段的通知模板详解
- **WECHAT_IMPLEMENTATION_SUMMARY.md** - 实现细节和技术说明

---

## ✅ 测试清单

- [ ] 配置WECHAT_WEBHOOK_URL
- [ ] 启动应用，检查定时任务初始化
- [ ] 点击"企微通知"按钮测试手动发送
- [ ] 验证企业微信群组收到通知
- [ ] 检查三个阶段的通知格式
- [ ] 查看应用日志确认无错误

---

**最后更新**: 2026-03-14 | **版本**: 1.0 | **状态**: ✅ 生产就绪
