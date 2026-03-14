import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/email-process-logs
 * 查询邮件处理日志
 *
 * 查询参数：
 * - status: PENDING | SUCCESS | FAILED (可选)
 * - messageId: 邮件 ID (可选)
 * - search: 搜索客户姓名或护照号 (可选)
 * - limit: 返回记录数 (默认 50)
 * - offset: 分页偏移 (默认 0)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const messageId = searchParams.get('messageId');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;
    if (messageId) where.messageId = messageId;

    // 如果有搜索词，需要搜索 extractedData 中的 customer_name 或 passport_no
    if (search) {
      where.OR = [
        {
          extractedData: {
            path: ['customer_name'],
            string_contains: search,
          },
        },
        {
          extractedData: {
            path: ['passport_no'],
            string_contains: search,
          },
        },
      ];
    }

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
      total,
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

