import prisma from '@/src/lib/prisma';
import fs from 'fs';
import path from 'path';

async function exportVisaTypes() {
  try {
    const visaTypes = await prisma.visaType.findMany({
      where: { isActive: true },
    });

    const seedData = {
      visaTypes: visaTypes.map(vt => ({
        code: vt.code,
        nameZh: vt.nameZh,
        nameId: vt.nameId,
        requiresEntry: vt.requiresEntry,
      })),
    };

    const outputPath = path.join(process.cwd(), 'prisma', 'seed-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2));
    console.log(`✓ VisaType 数据已导出到 ${outputPath}`);
  } catch (error) {
    console.error('导出失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportVisaTypes();
