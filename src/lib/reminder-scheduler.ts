/**
 * 定时提醒任务服务
 * 每天9:00 AM触发WeChat通知
 */

import { getRemindersStats } from './reminder-service';
import { sendAllStageNotifications } from './wechat-service';

let reminderScheduler: NodeJS.Timeout | null = null;

/**
 * 计算距离下一个9:00 AM的毫秒数
 */
function getTimeUntilNextNine(): number {
  const now = new Date();
  const next = new Date();

  // 设置为今天的9:00 AM
  next.setHours(9, 0, 0, 0);

  // 如果已经过了9:00 AM，设置为明天的9:00 AM
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

/**
 * 执行定时提醒任务
 */
async function executeReminderTask(): Promise<void> {
  try {
    console.log(`[提醒任务] 执行时间: ${new Date().toLocaleString('zh-CN')}`);

    const webhookUrl = process.env.WECHAT_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('[提醒任务] WeChat webhook URL未配置，跳过通知');
      return;
    }

    // 获取各阶段的签证
    const stats = await getRemindersStats();

    console.log(`[提醒任务] 阶段一(5天): ${stats.stage1Count}条`);
    console.log(`[提醒任务] 阶段二(3天): ${stats.stage2Count}条`);
    console.log(`[提醒任务] 阶段三(1天): ${stats.stage3Count}条`);

    // 发送通知
    const results = await sendAllStageNotifications(
      stats.stage1Visas,
      stats.stage2Visas,
      stats.stage3Visas,
      { webhookUrl }
    );

    console.log('[提醒任务] 阶段一通知:', results.stage1.message);
    console.log('[提醒任务] 阶段二通知:', results.stage2.message);
    console.log('[提醒任务] 阶段三通知:', results.stage3.message);
  } catch (error) {
    console.error('[提醒任务] 执行失败:', error);
  }
}

/**
 * 启动定时提醒任务
 */
export function startReminderScheduler(): void {
  if (reminderScheduler) {
    console.log('[提醒任务] 定时任务已在运行');
    return;
  }

  const timeUntilNext = getTimeUntilNextNine();
  const nextTime = new Date(Date.now() + timeUntilNext);

  console.log(`[提醒任务] 启动定时任务，下次执行时间: ${nextTime.toLocaleString('zh-CN')}`);

  // 首次执行前的延迟
  const initialTimeout = setTimeout(() => {
    executeReminderTask();

    // 之后每24小时执行一次
    reminderScheduler = setInterval(() => {
      executeReminderTask();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilNext);

  reminderScheduler = initialTimeout as any;
}

/**
 * 停止定时提醒任务
 */
export function stopReminderScheduler(): void {
  if (reminderScheduler) {
    clearTimeout(reminderScheduler);
    reminderScheduler = null;
    console.log('[提醒任务] 定时任务已停止');
  }
}

/**
 * 立即执行一次提醒任务
 */
export async function triggerReminderNow(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const webhookUrl = process.env.WECHAT_WEBHOOK_URL;
    if (!webhookUrl) {
      return {
        success: false,
        message: 'WeChat webhook URL未配置',
      };
    }

    const stats = await getRemindersStats();

    const results = await sendAllStageNotifications(
      stats.stage1Visas,
      stats.stage2Visas,
      stats.stage3Visas,
      { webhookUrl }
    );

    return {
      success: results.stage1.success && results.stage2.success && results.stage3.success,
      message: '提醒任务已执行',
      details: {
        stage1: results.stage1,
        stage2: results.stage2,
        stage3: results.stage3,
        stats: {
          stage1Count: stats.stage1Count,
          stage2Count: stats.stage2Count,
          stage3Count: stats.stage3Count,
        },
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `执行提醒任务失败: ${errorMessage}`,
    };
  }
}
