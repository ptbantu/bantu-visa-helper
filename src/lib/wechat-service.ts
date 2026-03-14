/**
 * WeChat企微通知服务
 */

import { VisaReminder } from './reminder-service';

export interface WeChatNotificationConfig {
  webhookUrl: string;
  groupId?: string;
}

/**
 * 生成Markdown格式的通知消息
 */
function generateNotificationMarkdown(reminders: VisaReminder[], stage: 1 | 2 | 3): string {
  const stageConfig = {
    1: {
      title: '📋 签证即将过期提醒 - 5天内',
      color: '#FFA500',
      emoji: '⚠️',
      description: '以下签证将在5天内过期，请及时处理',
    },
    2: {
      title: '🔴 签证紧急提醒 - 3天内',
      color: '#FF6B6B',
      emoji: '🚨',
      description: '以下签证将在3天内过期，请立即处理',
    },
    3: {
      title: '🔥 签证紧急到期 - 1天内',
      color: '#FF0000',
      emoji: '⛔',
      description: '以下签证将在1天内过期，请立即处理！',
    },
  };

  const config = stageConfig[stage];
  let markdown = `# ${config.emoji} ${config.title}\n\n`;
  markdown += `${config.description}\n\n`;
  markdown += `---\n\n`;

  reminders.forEach((reminder, index) => {
    const expiryDate = new Date(reminder.expiryDate).toLocaleDateString('zh-CN');
    markdown += `**${index + 1}. ${reminder.customerName}**\n`;
    markdown += `- 护照号: \`${reminder.passportNo}\`\n`;
    markdown += `- 签证类型: ${reminder.visaType}\n`;
    markdown += `- 到期日期: **${expiryDate}**\n`;
    markdown += `- 剩余天数: **${reminder.daysLeft}天**\n\n`;
  });

  markdown += `---\n`;
  markdown += `⏰ 发送时间: ${new Date().toLocaleString('zh-CN')}\n`;

  return markdown;
}

/**
 * 生成WeChat Markdown消息体
 */
function buildWeChatMarkdownMessage(markdown: string) {
  return {
    msgtype: 'markdown',
    markdown: {
      content: markdown,
    },
  };
}

/**
 * 发送WeChat企微通知
 */
export async function sendWeChatNotification(
  reminders: VisaReminder[],
  stage: 1 | 2 | 3,
  config: WeChatNotificationConfig
): Promise<{ success: boolean; message: string; response?: any }> {
  try {
    if (!config.webhookUrl) {
      return {
        success: false,
        message: 'WeChat webhook URL未配置',
      };
    }

    if (reminders.length === 0) {
      return {
        success: true,
        message: '没有需要通知的签证',
      };
    }

    const markdown = generateNotificationMarkdown(reminders, stage);
    const payload = buildWeChatMarkdownMessage(markdown);

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `WeChat API错误: ${response.status} ${errorText}`,
      };
    }

    const result = await response.json();

    if (result.errcode === 0) {
      return {
        success: true,
        message: `成功发送${reminders.length}条签证过期提醒`,
        response: result,
      };
    } else {
      return {
        success: false,
        message: `WeChat返回错误: ${result.errmsg}`,
        response: result,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `发送WeChat通知失败: ${errorMessage}`,
    };
  }
}

/**
 * 发送所有阶段的通知
 */
export async function sendAllStageNotifications(
  stage1: VisaReminder[],
  stage2: VisaReminder[],
  stage3: VisaReminder[],
  config: WeChatNotificationConfig
): Promise<{
  stage1: { success: boolean; message: string };
  stage2: { success: boolean; message: string };
  stage3: { success: boolean; message: string };
}> {
  const results = await Promise.all([
    sendWeChatNotification(stage1, 1, config),
    sendWeChatNotification(stage2, 2, config),
    sendWeChatNotification(stage3, 3, config),
  ]);

  return {
    stage1: { success: results[0].success, message: results[0].message },
    stage2: { success: results[1].success, message: results[1].message },
    stage3: { success: results[2].success, message: results[2].message },
  };
}
