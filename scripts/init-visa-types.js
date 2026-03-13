import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const visaTypes = [
  { code: 'C1', nameZh: '旅游签证', nameId: 'Visa Kunjungan Wisata (Tourism)', requiresEntry: false, isActive: true },
  { code: 'C2', nameZh: '商务签证', nameId: 'Visa Kunjungan Bisnis (Business)', requiresEntry: false, isActive: true },
  { code: 'C3', nameZh: '医疗签证', nameId: 'Visa Kunjungan Medis (Medical)', requiresEntry: false, isActive: true },
  { code: 'C4', nameZh: '政府事务签证', nameId: 'Visa Kunjungan Urusan Pemerintahan (Government)', requiresEntry: false, isActive: true },
  { code: 'C5', nameZh: '非商业短视频拍摄签证', nameId: 'Visa Kunjungan Jurnalistik (Journalism / Non-commercial short movie)', requiresEntry: false, isActive: true },
  { code: 'C6', nameZh: '参展签证', nameId: 'Visa Kunjungan Pameran (Exhibition)', requiresEntry: false, isActive: true },
  { code: 'C7', nameZh: '艺术文化签证', nameId: 'Visa Kunjungan Sosial Budaya (Art & Culture)', requiresEntry: false, isActive: true },
  { code: 'C8', nameZh: '参加短期课程或培训签证', nameId: 'Visa Kunjungan Kursus/Pelatihan Singkat (Short Course / Training)', requiresEntry: false, isActive: true },
  { code: 'C9', nameZh: '探亲签证', nameId: 'Visa Kunjungan Keluarga (Family Visit)', requiresEntry: false, isActive: true },
  { code: 'C10', nameZh: '过境签证', nameId: 'Visa Transit (Transit)', requiresEntry: false, isActive: true },
  { code: 'C11', nameZh: '参加体育赛事签证', nameId: 'Visa Kunjungan Olahraga (Sport Event)', requiresEntry: false, isActive: true },
  { code: 'C12', nameZh: '进行外籍投资先期考察签证', nameId: 'Visa Kunjungan Jajak Pendapat Investasi (Pre-Investment)', requiresEntry: false, isActive: true },
  { code: 'C13', nameZh: '进行多项投资评估及商定签证', nameId: 'Visa Kunjungan Penilaian Investasi (Investment assessment and agreement)', requiresEntry: false, isActive: true },
  { code: 'C14', nameZh: '提供技术指导、培训签证', nameId: 'Visa Kunjungan Bimbingan Teknis/Pelatihan (Technical guidance/training)', requiresEntry: false, isActive: true },
  { code: 'C15', nameZh: '执行审计、质量控制或巡视分支机构签证', nameId: 'Visa Kunjungan Audit/Kendali Mutu/Inspeksi (Audit, quality control, or inspection)', requiresEntry: false, isActive: true },
  { code: 'C16', nameZh: '驻印尼劳工考察工作地点签证', nameId: 'Visa Kunjungan Tinjauan Lokasi Kerja (Work location review for expatriate)', requiresEntry: false, isActive: true },
  { code: 'C17', nameZh: '短期外籍工作者考察签证', nameId: 'Visa Kunjungan Tinjauan Pekerja Asing Singkat (Short-term expatriate observation)', requiresEntry: false, isActive: true },
  { code: 'C18', nameZh: '商业短期考察、访问或商洽签证', nameId: 'Visa Kunjungan Bisnis Singkat (Short business observation/visit/negotiation)', requiresEntry: false, isActive: true },
  { code: 'C19', nameZh: '参加商业会议或展览签证', nameId: 'Visa Kunjungan Rapat/Pameran Bisnis (Business meeting/exhibition)', requiresEntry: false, isActive: true },
  { code: 'C20', nameZh: '作为外国公司代表参加会议签证', nameId: 'Visa Kunjungan Perwakilan Perusahaan Asing (Foreign company representative)', requiresEntry: false, isActive: true },
  { code: 'C21', nameZh: '设备采购或验货签证', nameId: 'Visa Kunjungan Pembelian Barang (Purchase of goods/inspection)', requiresEntry: false, isActive: true },
  { code: 'C22', nameZh: '与投资相关的法律咨询签证', nameId: 'Visa Kunjungan Konsultasi Hukum Investasi (Legal consultation related to investment)', requiresEntry: false, isActive: true },
  { code: 'E33E', nameZh: '电子工作签证 (ITAS)', nameId: 'Visa Tinggal Terbatas Elektronik (Electronic Limited Stay Visa)', requiresEntry: true, isActive: true },
  { code: 'E33G', nameZh: '工作签证 (ITAS)', nameId: 'Visa Tinggal Terbatas Kerja (Working Limited Stay Visa)', requiresEntry: true, isActive: true },
  { code: 'C312', nameZh: '工作签证 (ITAS)', nameId: 'ITAS Kerja (C312)', requiresEntry: true, isActive: true },
  { code: 'C313', nameZh: '投资签证 (ITAS - 1年)', nameId: 'ITAS Penanaman Modal 1 Tahun (C313)', requiresEntry: true, isActive: true },
  { code: 'C314', nameZh: '投资签证 (ITAS - 2年)', nameId: 'ITAS Penanaman Modal 2 Tahun (C314)', requiresEntry: true, isActive: true },
  { code: 'C316', nameZh: '留学签证 (ITAS)', nameId: 'ITAS Pelajar/Mahasiswa (C316)', requiresEntry: true, isActive: true },
  { code: 'C317', nameZh: '家属陪伴签证 (ITAS)', nameId: 'ITAS Penyatuan Keluarga (C317)', requiresEntry: true, isActive: true },
  { code: 'VOA', nameZh: '落地签证', nameId: 'Visa On Arrival', requiresEntry: false, isActive: true },
  { code: 'B211A', nameZh: '商务/旅游/探亲访问签证 (单次)', nameId: 'Visa Kunjungan Satu Kali Perjalanan (B211A)', requiresEntry: false, isActive: true },
  { code: 'B211B', nameZh: '商务访问签证 (单次-含工作审核)', nameId: 'Visa Kunjungan Satu Kali Perjalanan (B211B)', requiresEntry: false, isActive: true },
  { code: 'B211C', nameZh: '新闻报道签证 (单次)', nameId: 'Visa Kunjungan Satu Kali Perjalanan (B211C)', requiresEntry: false, isActive: true },
  { code: 'D212', nameZh: '多次往返访问签证', nameId: 'Visa Kunjungan Beberapa Kali Perjalanan (D212)', requiresEntry: false, isActive: true },
  { code: 'B1', nameZh: '旅游落地签证', nameId: 'Visa Kunjungan Saat Kedatangan Wisata (Tourism VOA)', requiresEntry: false, isActive: true },
  { code: 'B2', nameZh: '商务落地签证', nameId: 'Visa Kunjungan Saat Kedatangan Bisnis (Business VOA)', requiresEntry: false, isActive: true },
  { code: 'B3', nameZh: '医疗落地签证', nameId: 'Visa Kunjungan Saat Kedatangan Medis (Medical VOA)', requiresEntry: false, isActive: true },
  { code: 'B4', nameZh: '政府事务落地签证', nameId: 'Visa Kunjungan Saat Kedatangan Urusan Pemerintahan (Government VOA)', requiresEntry: false, isActive: true },
];

async function main() {
  console.log('开始初始化签证类型...');

  try {
    // 清空现有数据
    await prisma.visaType.deleteMany();
    console.log('✓ 清空现有签证类型');

    // 批量插入
    const created = await prisma.visaType.createMany({
      data: visaTypes,
    });

    console.log(`✅ 成功创建 ${created.count} 条签证类型`);
    console.log('\n签证类型统计:');
    console.log(`- 总数: ${created.count}`);
    console.log(`- ITAS 类型: ${visaTypes.filter(v => v.requiresEntry).length}`);
    console.log(`- 访问类型: ${visaTypes.filter(v => !v.requiresEntry).length}`);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
