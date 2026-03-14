import { NextResponse } from 'next/server';
import {
  queryVisasForReminder,
  queryVisasByStage,
  getRemindersStats,
  getAllRemindersFlat,
} from '@/src/lib/reminder-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let result;

    switch (type) {
      case 'stats':
        // 获取统计信息
        result = await getRemindersStats();
        break;

      case 'stage1':
        // 查询 5 天内到期的签证
        result = await queryVisasByStage(1);
        break;

      case 'stage2':
        // 查询 3 天内到期的签证
        result = await queryVisasByStage(2);
        break;

      case 'stage3':
        // 查询 1 天内到期的签证
        result = await queryVisasByStage(3);
        break;

      case 'grouped':
        // 获取分组的提醒
        result = await queryVisasForReminder();
        break;

      case 'flat':
      default:
        // 获取平铺的提醒列表
        result = await getAllRemindersFlat();
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      data: result,
    });
  } catch (error) {
    console.error('查询提醒失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
      },
      { status: 500 }
    );
  }
}
