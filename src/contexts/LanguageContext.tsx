"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'zh' | 'id';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  zh: {
    'app.title': 'Bantu 签证助手',
    'nav.main': '主导航',
    'nav.dashboard': '签证查询',
    'nav.reminders': '提醒助手',
    'nav.logs': '系统日志',
    'nav.settings': '系统配置',
    'nav.visa_category': '签证分类',
    'nav.b211a': 'B211A 访问签',
    'nav.kitas': 'ITAS & KITAS',
    'footer.version': '系统版本: v2.1.0',
    'footer.sync': '最后同步:',
    'table.edit': '编辑',
    'table.customer_name': '姓名',
    'table.passport_no': '护照号',
    'table.visa_type': '签证类型',
    'table.expiry_date': '有效期',
    'table.days_left': '剩余天数',
    'table.status': '状态',
    'table.download': '下载',
    'table.contact_phone': '联系电话',
    'table.whatsapp': 'WhatsApp',
    'table.voice_reminder': '语音通话提醒',
    'table.actions': '操作',
    'table.timestamp': '时间戳',
    'table.operation_type': '操作类型',
    'table.status_details': '状态详情',
    'table.countdown': '到期倒计时',
    'table.current_stage': '当前提醒阶段',
    'logs.title': '系统日志',
    'logs.parsed_emails': '今日解析邮件',
    'logs.extracted_visas': '今日提取签证',
    'logs.notifications': '今日电话/消息推送',
    'logs.execution_stream': '实时执行日志流水',
    'logs.warning_queue': '5-3-1 预警队列监控',
    'logs.unit_emails': '封',
    'logs.unit_visas': '份',
    'logs.unit_times': '次',
    'settings.title': '系统配置',
    'settings.email_config': '邮件抓取配置 (Konfigurasi Pengambilan Email)',
    'settings.email_desc': '管理系统监控哪一个邮箱的签证邮件',
    'settings.email_account': '监控邮箱账号',
    'settings.email_password': '授权密码 / App Password',
    'settings.email_filter': '特定发件人过滤',
    'settings.email_freq': '抓取频率',
    'settings.freq_1m': '1分钟 / 次',
    'settings.freq_5m': '5分钟 / 次',
    'settings.freq_15m': '15分钟 / 次',
    'settings.freq_30m': '30分钟 / 次',
    'settings.freq_60m': '1小时 / 次',
    'settings.test_conn': '测试连接 (Tes Koneksi)',
    'settings.testing': '测试中...',
    'settings.test_success': '连接成功！已成功登录 Gmail',
    'settings.test_error': '连接失败，请检查账号密码',
    'settings.push_config': '推送通道配置 (Konfigurasi Saluran Pemberitahuan)',
    'settings.push_desc': '配置企业微信机器人及语音电话提醒参数',
    'settings.wecom_bot': '企业微信机器人 (WeCom Bot)',
    'settings.webhook': 'Webhook 地址',
    'settings.send_test': '发送测试消息',
    'settings.template_preview': '消息模板预览 (5-3-1 提醒)',
    'settings.voice_bot': 'Bantu 语音机器人 (Voice Robot)',
    'settings.api_key': '阿里云 API Key',
    'settings.call_time': '默认呼叫时间段',
    'settings.time_working': '工作时间 (09:00 - 18:00)',
    'settings.time_extended': '延长时段 (08:00 - 20:00)',
    'settings.time_anytime': '全天候 (24小时，不建议)',
    'settings.call_time_desc': '设定机器人在什么时间段允许打电话，避免深夜骚扰。',
    'settings.receiver': '内部接收人 (默认签证主管)',
    'settings.receiver_desc': '当无法联系到客户或发生紧急预警时，系统将默认呼叫此主管。',
    'settings.cancel': '取消更改',
    'settings.save': '保存配置',
    'page.b211a.title': 'B211A 访问签',
    'page.kitas.title': 'ITAS & KITAS 工作签',
    'page.reminders.title': '提醒助手',
    'search.placeholder': '搜索护照号或姓名...',
  },
  id: {
    'app.title': 'Bantu Asisten Visa',
    'nav.main': 'Navigasi Utama',
    'nav.dashboard': 'Cek Visa',
    'nav.reminders': 'Asisten Pengingat',
    'nav.logs': 'Log Sistem',
    'nav.settings': 'Konfigurasi',
    'nav.visa_category': 'Kategori Visa',
    'nav.b211a': 'Visa Kunjungan B211A',
    'nav.kitas': 'ITAS & KITAS',
    'footer.version': 'Versi Sistem: v2.1.0',
    'footer.sync': 'Sinkronisasi Terakhir:',
    'table.edit': 'Edit',
    'table.customer_name': 'Nama',
    'table.passport_no': 'No. Paspor',
    'table.visa_type': 'Jenis Visa',
    'table.expiry_date': 'Masa Berlaku',
    'table.days_left': 'Sisa Hari',
    'table.status': 'Status',
    'table.download': 'Unduh',
    'table.contact_phone': 'No. Telepon',
    'table.whatsapp': 'WhatsApp',
    'table.voice_reminder': 'Pengingat Suara',
    'table.actions': 'Aksi',
    'table.timestamp': 'Waktu',
    'table.operation_type': 'Jenis Operasi',
    'table.status_details': 'Detail Status',
    'table.countdown': 'Hitung Mundur',
    'table.current_stage': 'Tahap Saat Ini',
    'logs.title': 'Log Sistem',
    'logs.parsed_emails': 'Email Diproses Hari Ini',
    'logs.extracted_visas': 'Visa Diekstrak Hari Ini',
    'logs.notifications': 'Notifikasi Hari Ini',
    'logs.execution_stream': 'Aliran Log Eksekusi Real-time',
    'logs.warning_queue': 'Antrean Peringatan 5-3-1',
    'logs.unit_emails': 'email',
    'logs.unit_visas': 'dokumen',
    'logs.unit_times': 'kali',
    'settings.title': 'Konfigurasi Sistem',
    'settings.email_config': 'Konfigurasi Pengambilan Email',
    'settings.email_desc': 'Kelola email mana yang dipantau sistem untuk visa',
    'settings.email_account': 'Akun Email',
    'settings.email_password': 'Kata Sandi Aplikasi / App Password',
    'settings.email_filter': 'Filter Pengirim',
    'settings.email_freq': 'Frekuensi Pengambilan',
    'settings.freq_1m': '1 Menit / Kali',
    'settings.freq_5m': '5 Menit / Kali',
    'settings.freq_15m': '15 Menit / Kali',
    'settings.freq_30m': '30 Menit / Kali',
    'settings.freq_60m': '1 Jam / Kali',
    'settings.test_conn': 'Tes Koneksi',
    'settings.testing': 'Menguji...',
    'settings.test_success': 'Koneksi Berhasil! Berhasil masuk ke Gmail',
    'settings.test_error': 'Koneksi Gagal, periksa akun dan kata sandi',
    'settings.push_config': 'Konfigurasi Saluran Pemberitahuan',
    'settings.push_desc': 'Konfigurasi bot WeCom dan parameter pengingat suara',
    'settings.wecom_bot': 'Bot WeCom',
    'settings.webhook': 'Alamat Webhook',
    'settings.send_test': 'Kirim Pesan Uji',
    'settings.template_preview': 'Pratinjau Templat Pesan (Pengingat 5-3-1)',
    'settings.voice_bot': 'Robot Suara Bantu',
    'settings.api_key': 'API Key Alibaba Cloud',
    'settings.call_time': 'Waktu Panggilan Default',
    'settings.time_working': 'Jam Kerja (09:00 - 18:00)',
    'settings.time_extended': 'Waktu Diperpanjang (08:00 - 20:00)',
    'settings.time_anytime': 'Kapan Saja (24 Jam, tidak disarankan)',
    'settings.call_time_desc': 'Atur kapan robot diizinkan menelepon untuk menghindari gangguan larut malam.',
    'settings.receiver': 'Penerima Internal (Default Supervisor Visa)',
    'settings.receiver_desc': 'Saat pelanggan tidak dapat dihubungi atau terjadi peringatan darurat, sistem akan menelepon supervisor ini secara default.',
    'settings.cancel': 'Batal',
    'settings.save': 'Simpan Konfigurasi',
    'page.b211a.title': 'Visa Kunjungan B211A',
    'page.kitas.title': 'Visa Kerja ITAS & KITAS',
    'page.reminders.title': 'Asisten Pengingat',
    'search.placeholder': 'Cari No. Paspor atau Nama...',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');

  useEffect(() => {
    const saved = localStorage.getItem('appLanguage');
    if (saved === 'zh' || saved === 'id') {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['zh']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
