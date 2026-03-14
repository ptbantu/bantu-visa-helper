import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

interface StatusBadgeProps {
  status: string;
  error?: string;
}

export const StatusBadge = ({ status, error }: StatusBadgeProps) => {
  const configs: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    SUCCESS: {
      color: "bg-green-100 text-green-700 border-green-200",
      label: "解析成功",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    PENDING: {
      color: "bg-amber-100 text-amber-700 border-amber-200",
      label: "正在处理",
      icon: <Clock className="w-3 h-3" />,
    },
    FAILED: {
      color: "bg-red-100 text-red-700 border-red-200",
      label: "解析失败",
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  const config = configs[status] || configs.PENDING;

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${config.color} font-medium border flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
      {error && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertCircle className="h-4 w-4 text-red-500 cursor-help flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{error}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export const truncateKey = (key: string, maxLength: number = 30): string => {
  if (key.length <= maxLength) return key;
  return key.substring(0, maxLength) + "...";
};

export const extractVisaInfo = (extractedData: any): { name?: string; passport?: string } => {
  if (!extractedData) return {};
  return {
    name: extractedData.customer_name,
    passport: extractedData.passport_no,
  };
};
