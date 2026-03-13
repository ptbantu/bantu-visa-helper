import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requiresEntry = searchParams.get('requiresEntry');
    const isActive = searchParams.get('isActive') !== 'false';

    const where: any = { isActive };
    if (requiresEntry !== null) {
      where.requiresEntry = requiresEntry === 'true';
    }

    const visaTypes = await prisma.visaType.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(visaTypes);
  } catch (error) {
    console.error('Error fetching visa types:', error);
    return NextResponse.json({ error: 'Failed to fetch visa types' }, { status: 500 });
  }
}
