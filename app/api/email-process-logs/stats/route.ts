import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/email-process-logs/stats
 * 获取处理统计信息
 */
export async function GET() {
  try {
    const stats = await prisma.emailProcessLog.groupBy({
      by: ['status'],
      _count: true,
    });

    let total_emails = 0;
    let success_count = 0;
    let pending_count = 0;
    let failed_count = 0;

    for (const stat of stats) {
      total_emails += stat._count;
      if (stat.status === 'PENDING') pending_count = stat._count;
      if (stat.status === 'SUCCESS') success_count = stat._count;
      if (stat.status === 'FAILED') failed_count = stat._count;
    }

    return NextResponse.json({
      success: true,
      data: {
        total_emails,
        success_count,
        pending_count,
        failed_count,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
