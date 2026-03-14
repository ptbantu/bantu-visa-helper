import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause: any = {};
    if (type === 'kitas') {
      whereClause = {
        visaType: {
          OR: [
            { code: { contains: 'ITAS' } },
            { code: { contains: 'C31' } },
            { code: { contains: 'C312' } },
            { code: { contains: 'C313' } },
            { code: { contains: 'C314' } },
          ]
        }
      };
    }

    const [visas, total] = await Promise.all([
      prisma.visaRecord.findMany({
        where: whereClause,
        include: {
          customer: true,
          visaType: true,
        },
        orderBy: { expiry_date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.visaRecord.count({ where: whereClause }),
    ]);

    return NextResponse.json({ data: visas, total });
  } catch (error) {
    console.error('Error fetching visas:', error);
    return NextResponse.json({ error: 'Failed to fetch visas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Step 1: Upsert customer
    const customer = await prisma.customer.upsert({
      where: { passport_no: data.passport_no },
      update: {
        name: data.customer_name,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
      },
      create: {
        passport_no: data.passport_no,
        name: data.customer_name,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
      },
    });

    // Step 2: Create visa record
    const visa = await prisma.visaRecord.create({
      data: {
        customerId: customer.id,
        visaTypeCode: data.visa_type_code || 'UNKNOWN',
        passport_no: data.passport_no,
        expiry_date: new Date(data.expiry_date),
        is_urgent: data.is_urgent || false,
        reminder_enabled: data.reminder_enabled || false,
        entry_date: data.entry_date ? new Date(data.entry_date) : null,
        port_of_entry: data.port_of_entry || null,
        file_url: data.file_url || null,
      },
      include: {
        customer: true,
        visaType: true,
      },
    });

    return NextResponse.json(visa, { status: 201 });
  } catch (error) {
    console.error('Error creating visa:', error);
    return NextResponse.json({ error: 'Failed to create visa' }, { status: 500 });
  }
}
