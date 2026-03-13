import { PrismaClient } from '@prisma/client';
import { addDays, subDays, format } from 'date-fns';

const prisma = new PrismaClient();

const today = new Date();

const mockVisaData = [
  {
    passport_no: "E12345678",
    expiry_date: format(addDays(today, 15), "yyyy-MM-dd"),
    customer_name: "张伟",
    visa_type: "B211A 商务签证",
    is_urgent: true,
    phone: "+86 13812345678",
    whatsapp: "+62 81234567890",
    reminder_enabled: true,
  },
  {
    passport_no: "E87654321",
    expiry_date: format(subDays(today, 5), "yyyy-MM-dd"),
    customer_name: "李娜",
    visa_type: "C314 投资签证",
    is_urgent: false,
  },
  {
    passport_no: "E11223344",
    expiry_date: format(addDays(today, 45), "yyyy-MM-dd"),
    customer_name: "王强",
    visa_type: "B211A 旅游签证",
    is_urgent: false,
  },
  {
    passport_no: "E99887766",
    expiry_date: format(addDays(today, 2), "yyyy-MM-dd"),
    customer_name: "赵敏",
    visa_type: "C312 工作签证",
    is_urgent: true,
  },
  {
    passport_no: "E55443322",
    expiry_date: format(addDays(today, 120), "yyyy-MM-dd"),
    customer_name: "孙杰",
    visa_type: "ITAS 工作签证",
    is_urgent: false,
    entry_date: format(subDays(today, 2), "yyyy-MM-dd"),
    port_of_entry: "CGK - 苏加诺-哈达",
    phone: "+86 13987654321",
    reminder_enabled: false,
  },
  {
    passport_no: "E66778899",
    expiry_date: format(subDays(today, 1), "yyyy-MM-dd"),
    customer_name: "周瑜",
    visa_type: "B211A 商务签证",
    is_urgent: true,
  },
  {
    passport_no: "E22334455",
    expiry_date: format(addDays(today, 8), "yyyy-MM-dd"),
    customer_name: "吴磊",
    visa_type: "ITAS 投资签证",
    is_urgent: true,
    entry_date: format(subDays(today, 10), "yyyy-MM-dd"),
    port_of_entry: "DPS - 伍拉·赖",
    whatsapp: "+62 8111222333",
    reminder_enabled: true,
  },
  {
    passport_no: "E77889900",
    expiry_date: format(addDays(today, 60), "yyyy-MM-dd"),
    customer_name: "郑爽",
    visa_type: "B211A 旅游签证",
    is_urgent: false,
  },
];

const mockSystemLogs = [
  { timestamp: "2026-03-13 14:32:05", type: "邮件解析", details: "成功解析 3 封来自 @imigrasi.go.id 的邮件", status: "success" },
  { timestamp: "2026-03-13 14:30:12", type: "签证提取", details: "提取到 2 份新 B211A 签证信息", status: "success" },
  { timestamp: "2026-03-13 14:15:00", type: "预警推送", details: "向王主管发送 1 条紧急预警 (黄先生)", status: "warning" },
  { timestamp: "2026-03-13 13:45:22", type: "语音外呼", details: "成功呼叫林女士，已确认延期意向", status: "success" },
  { timestamp: "2026-03-13 12:00:05", type: "系统错误", details: "连接邮箱服务器超时，将在 5 分钟后重试", status: "error" },
];

async function initializeDatabase() {
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
      mockVisaData.map(visa =>
        prisma.visaRecord.create({
          data: {
            customer_name: visa.customer_name,
            passport_no: visa.passport_no,
            visa_type: visa.visa_type,
            expiry_date: new Date(visa.expiry_date),
            is_urgent: visa.is_urgent || false,
            phone: visa.phone || null,
            whatsapp: visa.whatsapp || null,
            reminder_enabled: visa.reminder_enabled || false,
            entry_date: visa.entry_date ? new Date(visa.entry_date) : null,
            port_of_entry: visa.port_of_entry || null,
          },
        })
      )
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
    await prisma.appSettings.create({
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
        await prisma.reminder.create({
          data: {
            visa_id: visa.id,
            customer_name: visa.customer_name,
            passport_no: visa.passport_no,
            visa_type: visa.visa_type,
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

initializeDatabase();
