import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

/**
 * GET /api/email-process-logs
 * 查询邮件处理日志
 *
 * 查询参数：
 * - status: PENDING | SUCCESS | FAILED (可选)
 * - messageId: 邮件 ID (可选)
 * - limit: 返回记录数 (默认 50)
 * - offset: 分页偏移 (默认 0)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const messageId = searchParams.get('messageId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;
    if (messageId) where.messageId = messageId;

    const [logs, total] = await Promise.all([
      prisma.emailProcessLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.emailProcessLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching email process logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email-process-logs/[id]
 * 获取单条日志详情
 */
export async function getLogById(id: string) {
  try {
    const log = await prisma.emailProcessLog.findUnique({
      where: { id },
    });

    if (!log) {
      return NextResponse.json(
        { success: false, error: 'Log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Error fetching email process log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch log' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email-process-logs/stats
 * 获取处理统计信息
 */
export async function getStats() {
  try {
    const stats = await prisma.emailProcessLog.groupBy({
      by: ['status'],
      _count: true,
    });

    const result = {
      total: 0,
      pending: 0,
      success: 0,
      failed: 0,
    };

    for (const stat of stats) {
      result.total += stat._count;
      if (stat.status === 'PENDING') result.pending = stat._count;
      if (stat.status === 'SUCCESS') result.success = stat._count;
      if (stat.status === 'FAILED') result.failed = stat._count;
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
