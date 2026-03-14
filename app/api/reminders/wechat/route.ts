import { NextResponse } from 'next/server';
import { triggerReminderNow } from '@/src/lib/reminder-scheduler';

/**
 * POST /api/reminders/wechat
 * 手动触发WeChat企微通知
 */
export async function POST(request: Request) {
  try {
    const result = await triggerReminderNow();

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error('Error triggering WeChat notification:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to trigger WeChat notification' },
      { status: 500 }
    );
  }
}
