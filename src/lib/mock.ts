import { Visa, Reminder, SystemLog, AppSettings } from '../types/api';

export const mockB211AVisas: Visa[] = [
  { id: "1", customerId: "c1", customerName: "张三", passport: "E12345678", nationality: "中国", type: "B211A 商务", issueDate: "2023-10-01", expiryDate: "2023-11-30", status: "有效", progress: 60 },
  { id: "2", customerId: "c2", customerName: "李四", passport: "E87654321", nationality: "中国", type: "B211A 旅游", issueDate: "2023-10-15", expiryDate: "2023-12-14", status: "有效", progress: 20 },
  { id: "3", customerId: "c3", customerName: "John Doe", passport: "P11223344", nationality: "美国", type: "B211A 商务", issueDate: "2023-09-05", expiryDate: "2023-11-04", status: "即将过期", progress: 90 },
  { id: "4", customerId: "c4", customerName: "王五", passport: "E55667788", nationality: "中国", type: "B211A 旅游", issueDate: "2023-08-20", expiryDate: "2023-10-19", status: "已过期", progress: 100 },
];

export const mockKitasVisas: Visa[] = [
  { id: "101", customerId: "c5", customerName: "王五", passport: "E87654321", nationality: "中国", type: "C312 工作签", issueDate: "2023-05-15", expiryDate: "2024-05-14", status: "有效", company: "PT. Maju Jaya" },
  { id: "102", customerId: "c6", customerName: "赵六", passport: "E11223344", nationality: "中国", type: "C313 投资签", issueDate: "2022-11-10", expiryDate: "2023-11-09", status: "即将过期", company: "PT. Bintang Terang" },
  { id: "103", customerId: "c7", customerName: "Jane Smith", passport: "P99887766", nationality: "英国", type: "C314 投资签", issueDate: "2022-08-20", expiryDate: "2024-08-19", status: "有效", company: "PT. Global Investama" },
  { id: "104", customerId: "c8", customerName: "孙七", passport: "E55443322", nationality: "中国", type: "C312 工作签", issueDate: "2021-10-01", expiryDate: "2022-09-30", status: "已过期", company: "PT. Maju Jaya" },
];

export const mockReminders: Reminder[] = [
  { id: "1", visaId: "v1", customerName: "黄先生", passport: "E12345678", type: "B211A 商务", expiryDate: "2023-11-05", daysLeft: 1, stage: "阶段三 (1天)", status: "紧急预警" },
  { id: "2", visaId: "v2", customerName: "林女士", passport: "E87654321", type: "C312 工作签", expiryDate: "2023-11-07", daysLeft: 3, stage: "阶段二 (3天)", status: "电话提醒" },
  { id: "3", visaId: "v3", customerName: "陈先生", passport: "E11223344", type: "B211A 旅游", expiryDate: "2023-11-09", daysLeft: 5, stage: "阶段一 (5天)", status: "企微推送" },
  { id: "4", visaId: "v4", customerName: "张女士", passport: "E55667788", type: "C313 投资签", expiryDate: "2023-11-14", daysLeft: 10, stage: "常规监控", status: "正常" },
];

export const mockSystemLogs: SystemLog[] = [
  { id: "1", timestamp: "2023-10-25 14:32:05", type: "邮件解析", details: "成功解析 3 封来自 @imigrasi.go.id 的邮件", status: "success" },
  { id: "2", timestamp: "2023-10-25 14:30:12", type: "签证提取", details: "提取到 2 份新 B211A 签证信息", status: "success" },
  { id: "3", timestamp: "2023-10-25 14:15:00", type: "预警推送", details: "向王主管发送 1 条紧急预警 (黄先生)", status: "warning" },
  { id: "4", timestamp: "2023-10-25 13:45:22", type: "语音外呼", details: "成功呼叫林女士，已确认延期意向", status: "success" },
  { id: "5", timestamp: "2023-10-25 12:00:05", type: "系统错误", details: "连接邮箱服务器超时，将在 5 分钟后重试", status: "error" },
];

export const mockSettings: AppSettings = {
  emailConfig: {
    account: "admin@bantuqifu.com",
    passwordPlaceholder: "••••••••••••••••",
    filter: "@imigrasi.go.id",
    frequency: 5
  },
  pushConfig: {
    wecomWebhook: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxx-xxxx",
    voiceBotApiKeyPlaceholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxx",
    callTime: "working-hours",
    receiver: "wangshuo"
  }
};
