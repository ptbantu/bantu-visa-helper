import { Plane, Briefcase, Building, CreditCard, Clock } from "lucide-react";
import { VisaType } from "@/src/types/api";

export const getVisaIcon = (visaType: VisaType | string | null | undefined) => {
  const code = typeof visaType === 'string' ? visaType : visaType?.code || '';
  const nameZh = typeof visaType === 'string' ? '' : visaType?.nameZh || '';

  if (code.includes("B211A") || nameZh.includes("访问") || nameZh.includes("旅游")) {
    return <Plane className="h-4 w-4 text-blue-500 shrink-0" />;
  }
  if (nameZh.includes("工作") || code.includes("C312")) {
    return <Briefcase className="h-4 w-4 text-amber-600 shrink-0" />;
  }
  if (nameZh.includes("投资") || code.includes("C313") || code.includes("C314")) {
    return <Building className="h-4 w-4 text-green-600 shrink-0" />;
  }
  if (nameZh.includes("ITAS") || code.includes("C31")) {
    return <CreditCard className="h-4 w-4 text-purple-600 shrink-0" />;
  }
  return <Clock className="h-4 w-4 text-gray-500 shrink-0" />;
};
