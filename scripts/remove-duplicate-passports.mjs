import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeDuplicatePassports() {
  try {
    // 获取所有签证记录
    const allVisas = await prisma.visaRecord.findMany({
      orderBy: { createdAt: 'asc' },
    });

    console.log(`总共有 ${allVisas.length} 条签证记录`);

    // 按 passport_no 分组
    const groupedByPassport = new Map();
    for (const visa of allVisas) {
      if (!groupedByPassport.has(visa.passport_no)) {
        groupedByPassport.set(visa.passport_no, []);
      }
      groupedByPassport.get(visa.passport_no).push(visa);
    }

    // 找出重复的记录
    let deletedCount = 0;
    for (const [passportNo, visas] of groupedByPassport.entries()) {
      if (visas.length > 1) {
        console.log(`护照号 ${passportNo} 有 ${visas.length} 条记录`);

        // 保留第一条，删除其余的
        const toDelete = visas.slice(1);
        for (const visa of toDelete) {
          await prisma.visaRecord.delete({
            where: { id: visa.id },
          });
          deletedCount++;
          console.log(`  已删除: ${visa.id}`);
        }
      }
    }

    console.log(`\n总共删除了 ${deletedCount} 条重复记录`);
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeDuplicatePassports();
