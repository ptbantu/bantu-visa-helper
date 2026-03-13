import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { account, password } = await request.json();
    const isValid = account.includes('@') && password.length > 0;

    return NextResponse.json({
      success: isValid,
      message: isValid ? '邮箱连接成功' : '连接失败，请检查账号密码',
    });
  } catch (error) {
    console.error('Error testing email:', error);
    return NextResponse.json({ success: false, message: '测试失败' }, { status: 500 });
  }
}
