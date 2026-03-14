import prisma from '@/src/lib/prisma';
import { mockVisaData } from '@/src/data/mock';
import { mockSystemLogs } from '@/src/lib/mock';

async function main() {
  console.log('开始初始化数据库...');

  try {
    // 清空现有数据
    console.log('清空现有数据...');
    await prisma.reminder.deleteMany();
    await prisma.systemLog.deleteMany();
    await prisma.visaRecord.deleteMany();
    await prisma.appSettings.deleteMany();

    // 初始化签证数据
    console.log('初始化签证数据...');
    const visas = await Promise.all(
      mockVisaData.map(async visa => {
        // 先创建或获取 Customer
        const customer = await prisma.customer.upsert({
          where: { passport_no: visa.passport_no },
          update: { name: visa.customer_name },
          create: {
            passport_no: visa.passport_no,
            name: visa.customer_name,
          },
        });

        return prisma.visaRecord.create({
          data: {
            customerId: customer.id,
            visaTypeCode: 'UNKNOWN',
            passport_no: visa.passport_no,
            expiry_date: new Date(visa.expiry_date),
            is_urgent: visa.is_urgent || false,
            reminder_enabled: visa.reminder_enabled || false,
            entry_date: visa.entry_date ? new Date(visa.entry_date) : null,
            port_of_entry: visa.port_of_entry || null,
          },
        });
      })
    );
    console.log(`✓ 创建了 ${visas.length} 条签证记录`);

    // 初始化系统日志
    console.log('初始化系统日志...');
    const logs = await Promise.all(
      mockSystemLogs.map(log =>
        prisma.systemLog.create({
          data: {
            level: log.status === 'success' ? 'success' : log.status === 'error' ? 'error' : 'info',
            module: log.type,
            message: log.details,
            user: null,
            metadata: null,
          },
        })
      )
    );
    console.log(`✓ 创建了 ${logs.length} 条日志记录`);

    // 初始化应用设置
    console.log('初始化应用设置...');
    const settings = await prisma.appSettings.create({
      data: {
        id: 'singleton',
        email_account: 'admin@bantuqifu.com',
        email_filter: '@imigrasi.go.id',
        email_frequency_minutes: 5,
        voice_call_time: 'working-hours',
        voice_receiver: 'wangshuo',
      },
    });
    console.log('✓ 创建了应用设置');

    // 生成提醒
    console.log('生成提醒...');
    const now = new Date();
    let reminderCount = 0;

    for (const visa of visas) {
      const daysLeft = Math.ceil((visa.expiry_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let stage = '常规监控', status = '正常';
      if (daysLeft <= 1) { stage = '阶段三 (1天)'; status = '紧急预警'; }
      else if (daysLeft <= 3) { stage = '阶段二 (3天)'; status = '电话提醒'; }
      else if (daysLeft <= 5) { stage = '阶段一 (5天)'; status = '企微推送'; }

      if (daysLeft <= 5) {
        const customer = await prisma.customer.findUnique({
          where: { passport_no: visa.passport_no },
        });

        await prisma.reminder.create({
          data: {
            visa_id: visa.id,
            customer_name: customer?.name || 'Unknown',
            passport_no: visa.passport_no,
            visa_type: 'UNKNOWN',
            expiry_date: visa.expiry_date,
            days_left: daysLeft,
            stage,
            status,
          },
        });
        reminderCount++;
      }
    }
    console.log(`✓ 创建了 ${reminderCount} 条提醒记录`);

    console.log('\n✅ 数据库初始化完成！');
    console.log(`
统计信息：
- 签证记录: ${visas.length}
- 日志记录: ${logs.length}
- 提醒记录: ${reminderCount}
- 应用设置: 1
    `);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
