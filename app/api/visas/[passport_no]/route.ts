import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ passport_no: string }> }
) {
  try {
    const { passport_no } = await params;
    const data = await request.json();
    
    const updateData: any = {};
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
    if (data.reminder_enabled !== undefined) updateData.reminder_enabled = data.reminder_enabled;

    const visa = await prisma.visaRecord.updateMany({
      where: { passport_no },
      data: updateData
    });
    
    return NextResponse.json(visa);
  } catch (error) {
    console.error('Error updating visa:', error);
    return NextResponse.json({ error: 'Failed to update visa' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ passport_no: string }> }
) {
  try {
    const { passport_no } = await params;
    await prisma.visaRecord.deleteMany({
      where: { passport_no }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting visa:', error);
    return NextResponse.json({ error: 'Failed to delete visa' }, { status: 500 });
  }
}
