import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

// GET - 获取单个签证类型
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visaType = await prisma.visaType.findUnique({
      where: { id },
    });

    if (!visaType) {
      return NextResponse.json(
        { error: '签证类型不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(visaType);
  } catch (error) {
    console.error('获取签证类型失败:', error);
    return NextResponse.json(
      { error: '获取签证类型失败' },
      { status: 500 }
    );
  }
}

// PATCH - 更新签证类型
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, nameZh, nameId, requiresEntry, isActive } = body;

    // 检查签证类型是否存在
    const existing = await prisma.visaType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: '签证类型不存在' },
        { status: 404 }
      );
    }

    // 如果更改了代码，检查新代码是否已存在
    if (code && code !== existing.code) {
      const codeExists = await prisma.visaType.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: '签证代码已存在' },
          { status: 400 }
        );
      }
    }

    const visaType = await prisma.visaType.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(nameZh && { nameZh }),
        ...(nameId && { nameId }),
        ...(requiresEntry !== undefined && { requiresEntry }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(visaType);
  } catch (error) {
    console.error('更新签证类型失败:', error);
    return NextResponse.json(
      { error: '更新签证类型失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除签证类型
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 检查是否有关联的签证记录
    const visaRecords = await prisma.visaRecord.count({
      where: { visaTypeCode: id },
    });

    if (visaRecords > 0) {
      return NextResponse.json(
        { error: '该签证类型有关联的签证记录，无法删除' },
        { status: 400 }
      );
    }

    await prisma.visaType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除签证类型失败:', error);
    return NextResponse.json(
      { error: '删除签证类型失败' },
      { status: 500 }
    );
  }
}
