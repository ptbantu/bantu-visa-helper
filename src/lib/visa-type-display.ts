import { VisaType } from '@/src/types/api';

export type Language = 'zh' | 'id';

/**
 * 格式化签证类型显示
 * @param visaType VisaType 对象或 null/undefined
 * @param language 语言代码 ('zh' 或 'id')
 * @returns 格式化后的字符串，例如 "C18 试工签" 或 "C18 Visa Uji Coba"
 */
export function formatVisaType(
  visaType: VisaType | null | undefined,
  language: Language = 'zh'
): string {
  if (!visaType) {
    return '未知';
  }

  const code = visaType.code || '';
  const name = language === 'zh' ? visaType.nameZh : visaType.nameId;

  if (!name) {
    return code || '未知';
  }

  return `${code} ${name}`.trim();
}

/**
 * 获取签证类型的代码
 * @param visaType VisaType 对象或 null/undefined
 * @returns 签证类型代码，例如 "C18"
 */
export function getVisaTypeCode(visaType: VisaType | null | undefined): string {
  return visaType?.code || '未知';
}
