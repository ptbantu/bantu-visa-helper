import { addDays, subDays, format } from "date-fns";
import { VisaRecord } from "@/src/types/api";

const today = new Date();

export const mockVisaData: any[] = [
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
