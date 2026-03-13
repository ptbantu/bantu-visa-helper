import { PrismaClient } from '@prisma/client';
import seedData from './seed-data.json';

const prisma = new PrismaClient();

async function main() {
  console.log('开始 seed VisaType 数据...');

  for (const visaType of seedData.visaTypes) {
    await prisma.visaType.upsert({
      where: { code: visaType.code },
      update: {
        nameZh: visaType.nameZh,
        nameId: visaType.nameId,
        requiresEntry: visaType.requiresEntry,
        isActive: true,
      },
      create: {
        code: visaType.code,
        nameZh: visaType.nameZh,
        nameId: visaType.nameId,
        requiresEntry: visaType.requiresEntry,
        isActive: true,
      },
    });
  }

  console.log(`✓ 成功导入 ${seedData.visaTypes.length} 条 VisaType 记录`);
}

main()
  .catch((e) => {
    console.error('Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
