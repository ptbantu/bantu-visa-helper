import { startEmailScheduler } from '@/src/lib/email-scheduler';

/**
 * 初始化后台服务
 * 在应用启动时调用
 */
export function initializeBackgroundServices() {
  console.log('初始化后台服务...');

  // 启动邮件定时拉取
  const emailCheckInterval = parseInt(process.env.EMAIL_CHECK_INTERVAL_SECONDS || '300');
  startEmailScheduler(emailCheckInterval);

  console.log('✓ 后台服务初始化完成');
}
