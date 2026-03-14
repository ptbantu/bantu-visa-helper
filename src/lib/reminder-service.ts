import prisma from '@/src/lib/prisma';

export interface ReminderStage {
  stage: string;
  daysLeft: number;
  status: string;
  color: string;
}

export interface VisaReminder {
  id: string;
  customerId: string;
  customerName: string;
  passportNo: string;
  visaType: string;
  expiryDate: Date;
  daysLeft: number;
  stage: string;
  status: string;
  reminderEnabled: boolean;
}

/**
 * 获取提醒阶段信息
 * @param daysLeft 剩余天数
 * @returns 阶段信息
 */
export function getReminderStage(daysLeft: number): ReminderStage {
  if (daysLeft <= 1) {
    return {
      stage: '阶段三 (1天)',
      daysLeft,
      status: '紧急预警',
      color: 'red',
    };
  } else if (daysLeft <= 3) {
    return {
      stage: '阶段二 (3天)',
      daysLeft,
      status: '电话提醒',
      color: 'orange',
    };
  } else if (daysLeft <= 5) {
    return {
      stage: '阶段一 (5天)',
      daysLeft,
      status: '企微推送',
      color: 'yellow',
    };
  } else {
    return {
      stage: '常规监控',
      daysLeft,
      status: '正常',
      color: 'green',
    };
  }
}

/**
 * 查询所有需要提醒的签证
 * @returns 按阶段分类的签证列表
 */
export async function queryVisasForReminder(): Promise<{
  stage1: VisaReminder[];
  stage2: VisaReminder[];
  stage3: VisaReminder[];
  total: number;
}> {
  try {
    const now = new Date();

    // 查询所有启用提醒的签证
    const visas = await prisma.visaRecord.findMany({
      where: { reminder_enabled: true },
      include: {
        customer: true,
        visaType: true,
      },
    });

    const stage1: VisaReminder[] = [];
    const stage2: VisaReminder[] = [];
    const stage3: VisaReminder[] = [];

    for (const visa of visas) {
      const daysLeft = Math.ceil(
        (visa.expiry_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const reminder: VisaReminder = {
        id: visa.id,
        customerId: visa.customerId,
        customerName: visa.customer.name,
        passportNo: visa.passport_no,
        visaType: visa.visaType.code,
        expiryDate: visa.expiry_date,
        daysLeft,
        stage: '',
        status: '',
        reminderEnabled: visa.reminder_enabled,
      };

      const stageInfo = getReminderStage(daysLeft);
      reminder.stage = stageInfo.stage;
      reminder.status = stageInfo.status;

      // 按阶段分类
      if (daysLeft <= 1) {
        stage3.push(reminder);
      } else if (daysLeft <= 3) {
        stage2.push(reminder);
      } else if (daysLeft <= 5) {
        stage1.push(reminder);
      }
    }

    // 按到期日期排序（最近的在前）
    const sortByExpiry = (a: VisaReminder, b: VisaReminder) =>
      a.expiryDate.getTime() - b.expiryDate.getTime();

    stage1.sort(sortByExpiry);
    stage2.sort(sortByExpiry);
    stage3.sort(sortByExpiry);

    return {
      stage1,
      stage2,
      stage3,
      total: stage1.length + stage2.length + stage3.length,
    };
  } catch (error) {
    console.error('查询提醒签证失败:', error);
    throw error;
  }
}

/**
 * 查询特定阶段的签证
 * @param stage 阶段：1、2、3
 * @returns 该阶段的签证列表
 */
export async function queryVisasByStage(stage: 1 | 2 | 3): Promise<VisaReminder[]> {
  try {
    const reminders = await queryVisasForReminder();

    switch (stage) {
      case 1:
        return reminders.stage1;
      case 2:
        return reminders.stage2;
      case 3:
        return reminders.stage3;
      default:
        return [];
    }
  } catch (error) {
    console.error(`查询第 ${stage} 阶段签证失败:`, error);
    throw error;
  }
}

/**
 * 查询即将到期的签证统计
 * @returns 各阶段的统计信息
 */
export async function getRemindersStats(): Promise<{
  stage1Count: number;
  stage2Count: number;
  stage3Count: number;
  totalCount: number;
  stage1Visas: VisaReminder[];
  stage2Visas: VisaReminder[];
  stage3Visas: VisaReminder[];
}> {
  try {
    const reminders = await queryVisasForReminder();

    return {
      stage1Count: reminders.stage1.length,
      stage2Count: reminders.stage2.length,
      stage3Count: reminders.stage3.length,
      totalCount: reminders.total,
      stage1Visas: reminders.stage1,
      stage2Visas: reminders.stage2,
      stage3Visas: reminders.stage3,
    };
  } catch (error) {
    console.error('获取提醒统计失败:', error);
    throw error;
  }
}

/**
 * 查询所有需要提醒的签证（平铺列表）
 * @returns 所有需要提醒的签证，按到期日期排序
 */
export async function getAllRemindersFlat(): Promise<VisaReminder[]> {
  try {
    const reminders = await queryVisasForReminder();
    const all = [...reminders.stage1, ...reminders.stage2, ...reminders.stage3];
    return all.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
  } catch (error) {
    console.error('查询所有提醒签证失败:', error);
    throw error;
  }
}
