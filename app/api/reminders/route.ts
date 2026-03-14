import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (stage !== 'all') where.stage = { contains: stage };

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        orderBy: { expiry_date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.reminder.count({ where }),
    ]);

    const stats = {
      stage1_count: await prisma.reminder.count({ where: { stage: { contains: '阶段一' } } }),
      stage2_count: await prisma.reminder.count({ where: { stage: { contains: '阶段二' } } }),
      stage3_count: await prisma.reminder.count({ where: { stage: { contains: '阶段三' } } }),
      unacknowledged_count: await prisma.reminder.count({ where: { is_acknowledged: false } }),
    };

    return NextResponse.json({ reminders, stats, total });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const visas = await prisma.visaRecord.findMany({
      where: { reminder_enabled: true },
      include: { customer: true, visaType: true },
      orderBy: { expiry_date: 'desc' },
    });

    const now = new Date();
    let created = 0, updated = 0;

    for (const visa of visas) {
      const daysLeft = Math.ceil((visa.expiry_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let stage = "常规监控", status = "正常";
      if (daysLeft <= 1) { stage = "阶段三 (1天)"; status = "紧急预警"; }
      else if (daysLeft <= 3) { stage = "阶段二 (3天)"; status = "电话提醒"; }
      else if (daysLeft <= 5) { stage = "阶段一 (5天)"; status = "企微推送"; }

      const existing = await prisma.reminder.findFirst({ where: { visa_id: visa.id } });

      if (existing) {
        await prisma.reminder.update({
          where: { id: existing.id },
          data: { days_left: daysLeft, stage, status },
        });
        updated++;
      } else {
        await prisma.reminder.create({
          data: {
            visa_id: visa.id,
            customer_name: visa.customer.name,
            passport_no: visa.passport_no,
            visa_type: visa.visaType.code,
            expiry_date: visa.expiry_date,
            days_left: daysLeft,
            stage,
            status,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ created, updated });
  } catch (error) {
    console.error('Error triggering reminders:', error);
    return NextResponse.json({ error: 'Failed to trigger reminders' }, { status: 500 });
  }
}
