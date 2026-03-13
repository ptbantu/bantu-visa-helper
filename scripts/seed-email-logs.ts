import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建测试数据...');

  const statuses = ['SUCCESS', 'PENDING', 'FAILED'];
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

  const visaTypes = [
    'B211A 商务签',
    'B211A 旅游签',
    'C312 工作签',
    'C313 投资签',
    'C314 投资签',
    'ITAS 工作签',
  ];

  const errors = [
    'Qwen API 超时',
    'OSS 上传失败',
    'PDF 文本提取失败',
    '数据库连接错误',
    'JSON 解析失败',
  ];

  const logs = [];

  for (let i = 1; i <= 30; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const visaType = visaTypes[Math.floor(Math.random() * visaTypes.length)];
    const messageId = `msg-${String(i).padStart(3, '0')}`;
    const pdfKey = `visas/20260313/${String(i).padStart(3, '0')}-${Math.random().toString(36).substring(7)}.pdf`;
    const pdfFilename = `visa_${String(i).padStart(3, '0')}.pdf`;

    const createdAt = new Date();
    createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 24));

    const data: any = {
      messageId,
      pdfKey,
      pdfFilename,
      status,
      createdAt,
    };

    if (status === 'SUCCESS') {
      data.extractedData = {
        customer_name: customer.name,
        passport_no: customer.passport,
        visa_type: visaType,
        expiry_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        entry_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      };
      data.processedAt = new Date(createdAt.getTime() + Math.random() * 60000);
    } else if (status === 'FAILED') {
      data.errorMessage = errors[Math.floor(Math.random() * errors.length)];
    }

    logs.push(data);
  }

  // 批量创建
  for (const log of logs) {
    await prisma.emailProcessLog.create({ data: log });
  }

  console.log(`✓ 成功创建 ${logs.length} 条测试数据`);

  // 显示统计信息
  const stats = await prisma.emailProcessLog.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\n统计信息：');
  for (const stat of stats) {
    console.log(`  ${stat.status}: ${stat._count} 条`);
  }

  const total = await prisma.emailProcessLog.count();
  console.log(`  总计: ${total} 条`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
