import { NextResponse } from 'next/server';
import { initializeBackgroundServices } from '@/src/lib/background-services';

// 标记：确保这个路由只在服务器启动时执行一次
let initialized = false;

export async function GET() {
  try {
    if (!initialized) {
      console.log('初始化应用后台服务...');
      initializeBackgroundServices();
      initialized = true;
    }
    return NextResponse.json({ status: 'ok', initialized: true });
  } catch (error) {
    console.error('初始化失败:', error);
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 });
  }
}
