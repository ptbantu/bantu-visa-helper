import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建签证测试数据...');

  const customers = [
    { name: '张三', passport: 'E12345678' },
    { name: '李四', passport: 'E87654321' },
    { name: '王五', passport: 'E11223344' },
    { name: '赵六', passport: 'E55667788' },
    { name: '孙七', passport: 'E99887766' },
    { name: '周八', passport: 'E22334455' },
    { name: '吴九', passport: 'E77889900' },
    { name: '郑十', passport: 'E44556677' },
  ];

  const visaTypeCodes = [
    'B211A',
    'C312',
    'C313',
    'C314',
    'ITAS',
  ];

  const visas = [];

  // 先创建或获取客户
  const createdCustomers = [];
  for (const customer of customers) {
    const existing = await prisma.customer.findUnique({
      where: { passport_no: customer.passport },
    });

    if (existing) {
      createdCustomers.push(existing);
    } else {
      const created = await prisma.customer.create({
        data: {
          passport_no: customer.passport,
          name: customer.name,
        },
      });
      createdCustomers.push(created);
    }
  }

  console.log(`✓ 客户数据准备完成（${createdCustomers.length} 个）`);

  // 创建签证记录
  for (let i = 1; i <= 30; i++) {
    const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];
    const visaTypeCode = visaTypeCodes[Math.floor(Math.random() * visaTypeCodes.length)];

    // 随机生成过期日期
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * 365) - 180); // -180 到 +180 天

    // 随机生成入境日期
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() - Math.floor(Math.random() * 90)); // 过去 0-90 天

    const isUrgent = Math.random() > 0.7; // 30% 概率为紧急

    const data = {
      customerId: customer.id,
      visaTypeCode,
      passport_no: customer.passport,
      expiry_date: expiryDate,
      entry_date: entryDate,
      is_urgent: isUrgent,
      reminder_enabled: Math.random() > 0.3, // 70% 概率启用提醒
      port_of_entry: ['CGK - 苏加诺-哈达', 'DPS - 伍拉·赖', 'SUB - 朱安达', 'BDO - 班达拉纳克'][
        Math.floor(Math.random() * 4)
      ],
      file_url: `https://bantuqifu-dev.oss-ap-southeast-5.aliyuncs.com/visas/20260313/${String(i).padStart(3, '0')}-${Math.random().toString(36).substring(7)}.pdf`,
    };

    try {
      await prisma.visaRecord.create({ data });
      visas.push(data);
    } catch (error: any) {
      // 如果是唯一性约束冲突，跳过
      if (error.code === 'P2002') {
        console.log(`⚠ 记录 ${i} 已存在，跳过`);
      } else {
        throw error;
      }
    }
  }

  console.log(`✓ 成功创建 ${visas.length} 条签证记录`);

  // 显示统计信息
  const stats = await prisma.visaRecord.findMany({
    select: {
      expiry_date: true,
      is_urgent: true,
      reminder_enabled: true,
    },
  });

  const now = new Date();
  let expired = 0;
  let expiringSoon = 0;
  let valid = 0;
  let urgent = 0;
  let reminderEnabled = 0;

  for (const record of stats) {
    const daysLeft = Math.floor((record.expiry_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) expired++;
    else if (daysLeft <= 30) expiringSoon++;
    else valid++;

    if (record.is_urgent) urgent++;
    if (record.reminder_enabled) reminderEnabled++;
  }

  console.log('\n签证统计信息：');
  console.log(`  已过期: ${expired} 条`);
  console.log(`  即将过期 (≤30天): ${expiringSoon} 条`);
  console.log(`  有效: ${valid} 条`);
  console.log(`  加急处理: ${urgent} 条`);
  console.log(`  已启用提醒: ${reminderEnabled} 条`);
  console.log(`  总计: ${stats.length} 条`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
