import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function POST(request: Request) {
  try {
    const { action, passport_nos } = await request.json();

    if (!Array.isArray(passport_nos) || passport_nos.length === 0) {
      return NextResponse.json({ error: 'Invalid passport numbers' }, { status: 400 });
    }

    if (action === 'enable_reminders') {
      await prisma.visaRecord.updateMany({
        where: { passport_no: { in: passport_nos } },
        data: { reminder_enabled: true }
      });
    } else if (action === 'disable_reminders') {
      await prisma.visaRecord.updateMany({
        where: { passport_no: { in: passport_nos } },
        data: { reminder_enabled: false }
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 });
  }
}
