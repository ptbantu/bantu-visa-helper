import { startEmailScheduler } from '@/src/lib/email-scheduler';
import { startReminderScheduler } from '@/src/lib/reminder-scheduler';

/**
 * 初始化后台服务
 * 在应用启动时调用
 */
export function initializeBackgroundServices() {
  console.log('初始化后台服务...');

  // 启动邮件定时拉取
  const emailCheckInterval = parseInt(process.env.EMAIL_CHECK_INTERVAL_SECONDS || '300');
  startEmailScheduler(emailCheckInterval);

  // 启动定时提醒任务（每天9:00 AM）
  if (process.env.WECHAT_WEBHOOK_URL) {
    startReminderScheduler();
  } else {
    console.warn('⚠ WECHAT_WEBHOOK_URL未配置，跳过定时提醒任务');
  }

  console.log('✓ 后台服务初始化完成');
}
