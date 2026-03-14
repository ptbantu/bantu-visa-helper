import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET - 获取所有签证类型
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const [visaTypes, total] = await Promise.all([
      prisma.visaType.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.visaType.count(),
    ]);

    return NextResponse.json({
      data: visaTypes,
      total,
    });
  } catch (error) {
    console.error('获取签证类型失败:', error);
    return NextResponse.json(
      { error: '获取签证类型失败' },
      { status: 500 }
    );
  }
}

// POST - 创建签证类型
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, nameZh, nameId, requiresEntry, isActive } = body;

    // 验证必填字段
    if (!code || !nameZh || !nameId) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 检查代码是否已存在
    const existing = await prisma.visaType.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: '签证代码已存在' },
        { status: 400 }
      );
    }

    const visaType = await prisma.visaType.create({
      data: {
        code,
        nameZh,
        nameId,
        requiresEntry: requiresEntry || false,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(visaType, { status: 201 });
  } catch (error) {
    console.error('创建签证类型失败:', error);
    return NextResponse.json(
      { error: '创建签证类型失败' },
      { status: 500 }
    );
  }
}
