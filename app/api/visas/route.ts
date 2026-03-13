import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // e.g., 'kitas' or 'all'
    
    let whereClause = {};
    if (type === 'kitas') {
      whereClause = {
        OR: [
          { visa_type: { contains: 'ITAS' } },
          { visa_type: { contains: 'C31' } },
          { visa_type: { contains: '工作' } },
          { visa_type: { contains: '投资' } },
        ]
      };
    }
    
    const visas = await prisma.visaRecord.findMany({
      where: whereClause,
      orderBy: { expiry_date: 'asc' }
    });
    
    return NextResponse.json(visas);
  } catch (error) {
    console.error('Error fetching visas:', error);
    return NextResponse.json({ error: 'Failed to fetch visas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const visa = await prisma.visaRecord.create({
      data: {
        customer_name: data.customer_name,
        passport_no: data.passport_no,
        visa_type: data.visa_type,
        expiry_date: new Date(data.expiry_date),
        is_urgent: data.is_urgent || false,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        reminder_enabled: data.reminder_enabled || false,
        entry_date: data.entry_date ? new Date(data.entry_date) : null,
        port_of_entry: data.port_of_entry || null,
      }
    });
    return NextResponse.json(visa, { status: 201 });
  } catch (error) {
    console.error('Error creating visa:', error);
    return NextResponse.json({ error: 'Failed to create visa' }, { status: 500 });
  }
}
