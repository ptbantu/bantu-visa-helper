import { fetchEmailsFromImap } from './email-service';
import { cleanupTempDirectory } from './pdf-to-image';

let emailScheduleInterval: NodeJS.Timeout | null = null;

/**
 * 启动邮件定时拉取
 * @param intervalSeconds 拉取间隔（秒），默认 5 分钟
 */
export function startEmailScheduler(intervalSeconds: number = 300) {
  if (emailScheduleInterval) {
    console.log('邮件定时器已在运行，跳过重复启动');
    return;
  }

  console.log(`启动邮件定时拉取，间隔: ${intervalSeconds} 秒`);

  // 立即执行一次
  executeEmailFetch();

  // 设置定时任务
  emailScheduleInterval = setInterval(() => {
    executeEmailFetch();
  }, intervalSeconds * 1000);

  console.log('✓ 邮件定时器已启动');
}

/**
 * 停止邮件定时拉取
 */
export function stopEmailScheduler() {
  if (emailScheduleInterval) {
    clearInterval(emailScheduleInterval);
    emailScheduleInterval = null;
    console.log('✓ 邮件定时器已停止');
  }
}

/**
 * 执行邮件拉取
 */
async function executeEmailFetch() {
  try {
    console.log(`\n=== 邮件定时拉取 [${new Date().toISOString()}] ===`);

    // 清空临时目录
    console.log('清空临时目录...');
    cleanupTempDirectory();

    const result = await fetchEmailsFromImap();
    console.log(`✓ 邮件拉取完成:`);
    console.log(`  - 处理: ${result.processedCount} 封`);
    console.log(`  - 成功: ${result.successCount} 封`);
    console.log(`  - 失败: ${result.failedCount} 封`);
    console.log(`  - 跳过: ${result.skippedCount} 封`);
  } catch (error) {
    console.error('邮件拉取异常:', error);
  }
}

/**
 * 手动触发邮件拉取
 */
export async function triggerEmailFetch() {
  console.log('手动触发邮件拉取...');
  return await executeEmailFetch();
}
