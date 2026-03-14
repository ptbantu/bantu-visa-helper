import type { PDFDocument } from 'pdfjs-dist';

// 使用 require 导入 pdf-parse
let pdfParseModule = require('pdf-parse');

// 处理不同的导出方式
const pdfParse = pdfParseModule.default || pdfParseModule;

export interface ITKDocumentData {
  // 证件状态类
  permit_number?: string;
  expiry_date?: string;
  stay_index?: string;
  document_type?: string;

  // 持有人身份类
  full_name?: string;
  place_of_birth?: string;
  passport_number?: string;
  passport_expiry?: string;
  nationality?: string;
  gender?: string;

  // 居留细节类
  address?: string;
  activity?: string;
  occupation?: string;
  guarantor?: string;

  // 签发与机关类
  ministry_name?: string;
  issuing_office?: string;
  issuing_date?: string;
  issuing_location?: string;
  office_address?: string;

  // 元数据
  is_itk?: boolean;
  is_evisa?: boolean;
  raw_text?: string;
}

/**
 * 从 PDF Buffer 提取文本
 */
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF 文本提取失败:', error);
    throw error;
  }
}

/**
 * 检查是否为 ITK 文档
 */
function isITKDocument(text: string): boolean {
  return text.includes('IZIN TINGGAL KUNJUNGAN') || text.includes('Visit Stay Permit');
}

/**
 * 检查是否为 EVISA 文档
 */
function isEVISADocument(text: string): boolean {
  return text.includes('EVISA') || text.includes('e-Visa');
}

/**
 * 提取字段值（容错处理）
 */
function extractField(text: string, keywords: string[], nextKeywords?: string[]): string | undefined {
  try {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[:\\s]+([^\\n]+)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        let value = match[1].trim();

        // 如果指定了下一个关键字，则截断到下一个关键字之前
        if (nextKeywords) {
          for (const nextKeyword of nextKeywords) {
            const nextIndex = value.toLowerCase().indexOf(nextKeyword.toLowerCase());
            if (nextIndex > 0) {
              value = value.substring(0, nextIndex).trim();
            }
          }
        }

        // 清理特殊字符和多余空格
        value = value.replace(/[^\w\s\-\/\.\,]/g, '').trim();

        if (value && value.length > 0) {
          return value;
        }
      }
    }
  } catch (error) {
    console.warn(`提取字段失败 (${keywords.join(', ')}):`, error);
  }
  return undefined;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;

  try {
    // 移除非日期字符
    dateStr = dateStr.replace(/[^\d\-\/\.]/g, '').trim();

    // 尝试解析不同的日期格式
    let date: Date | null = null;

    // 格式：YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      date = new Date(dateStr);
    }
    // 格式：DD/MM/YYYY 或 DD-MM-YYYY
    else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(dateStr)) {
      const parts = dateStr.split(/[-\/]/);
      date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    // 格式：YYYY/MM/DD
    else if (/^\d{4}[-\/]\d{2}[-\/]\d{2}$/.test(dateStr)) {
      date = new Date(dateStr.replace(/\//g, '-'));
    }

    if (date && !isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.warn(`日期格式化失败 (${dateStr}):`, error);
  }

  return undefined;
}

/**
 * 解析 ITK 文档
 */
export async function parseITKDocument(pdfBuffer: Buffer): Promise<ITKDocumentData> {
  const result: ITKDocumentData = {};

  try {
    // 提取文本
    const text = await extractTextFromPDF(pdfBuffer);
    result.raw_text = text;

    // 检查文档类型
    result.is_evisa = isEVISADocument(text);
    result.is_itk = isITKDocument(text);

    if (result.is_evisa) {
      throw new Error('Not an ITK document');
    }

    if (!result.is_itk) {
      console.warn('文档不包含 ITK 标识');
    }

    // 证件状态类
    result.permit_number = extractField(text, ['Permit Number', 'Nomor Izin']);
    result.expiry_date = formatDate(
      extractField(text, ['Stay Permit Expiry', 'Berlaku Sampai', 'Expiry Date'])
    );
    result.stay_index = extractField(text, ['Stay Permit Index', 'Indeks Izin Tinggal']);
    result.document_type = extractField(text, ['Document Type', 'Jenis Dokumen', 'Izin Tinggal']);

    // 持有人身份类
    result.full_name = extractField(text, ['Full Name', 'Nama Lengkap', 'Name']);
    result.place_of_birth = extractField(text, ['Place of Birth', 'Tempat Lahir', 'Place / Date of Birth']);
    result.passport_number = extractField(text, ['Passport Number', 'Nomor Paspor', 'Passport No']);
    result.passport_expiry = formatDate(
      extractField(text, ['Passport Expiry', 'Berlaku Paspor', 'Passport Valid Until'])
    );
    result.nationality = extractField(text, ['Nationality', 'Kebangsaan', 'Negara']);
    result.gender = extractField(text, ['Gender', 'Jenis Kelamin', 'Sex']);

    // 居留细节类
    result.address = extractField(text, ['Address', 'Alamat', 'Registered Address']);
    result.activity = extractField(text, ['Activity', 'Kegiatan', 'Purpose']);
    result.occupation = extractField(text, ['Occupation', 'Pekerjaan', 'Profesi']);
    result.guarantor = extractField(text, ['Guarantor', 'Penjamin', 'Sponsor']);

    // 签发与机关类
    result.ministry_name = extractField(text, ['Ministry', 'Kementerian', 'Ministry of Immigration']);
    result.issuing_office = extractField(text, ['Issuing Office', 'Kantor Penerbit', 'Kantor Imigrasi']);
    result.issuing_date = formatDate(
      extractField(text, ['Issuing Date', 'Tanggal Terbit', 'Date of Issue'])
    );
    result.issuing_location = extractField(text, ['Issuing Location', 'Lokasi Terbit', 'Issued at']);
    result.office_address = extractField(text, ['Office Address', 'Alamat Kantor', 'Address']);

    return result;
  } catch (error) {
    if (error instanceof Error && error.message === 'Not an ITK document') {
      throw error;
    }
    console.error('ITK 文档解析失败:', error);
    throw error;
  }
}

/**
 * 验证 ITK 文档是否有效
 */
export function validateITKDocument(data: ITKDocumentData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.is_itk) {
    errors.push('文档不是 ITK 类型');
  }

  if (data.is_evisa) {
    errors.push('文档是 EVISA，不是 ITK');
  }

  // 检查必需字段
  if (!data.permit_number) {
    errors.push('缺少 Permit Number');
  }

  if (!data.expiry_date) {
    errors.push('缺少 Stay Permit Expiry');
  }

  if (!data.full_name) {
    errors.push('缺少 Full Name');
  }

  if (!data.passport_number) {
    errors.push('缺少 Passport Number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
