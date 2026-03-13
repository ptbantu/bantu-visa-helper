import prisma from './src/lib/prisma.js';

async function main() {
  try {
    const visas = await prisma.visaRecord.findMany({
      where: {
        OR: [
          { visa_type: { contains: 'ITAS' } },
        ]
      },
      orderBy: { expiry_date: 'asc' }
    });
    console.log(visas);
  } catch (e) {
    console.error(e);
  }
}

main();