import { NextResponse } from 'next/server';
import { triggerEmailFetch } from '@/src/lib/email-scheduler';

export async function POST(request: Request) {
  try {
    console.log('手动触发邮件拉取 API 被调用');
    await triggerEmailFetch();
    return NextResponse.json({ success: true, message: '邮件拉取已触发' });
  } catch (error) {
    console.error('手动触发邮件拉取失败:', error);
    return NextResponse.json(
      { success: false, error: '邮件拉取失败' },
      { status: 500 }
    );
  }
}
