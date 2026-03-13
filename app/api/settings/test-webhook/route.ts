import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { webhook_url } = await request.json();

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: 'text',
        text: { content: '这是来自 Bantu Visa Helper 的测试消息' },
      }),
    });

    return NextResponse.json({
      success: response.ok,
      message: response.ok ? '企业微信推送测试成功' : '推送失败',
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json({ success: false, message: '网络错误' }, { status: 500 });
  }
}
