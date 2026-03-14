import { Button } from "@/src/components/ui/button";
import { useLanguage } from "@/src/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationBarProps {
  current: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
}

export function PaginationBar({
  current,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
}: PaginationBarProps) {
  const { t } = useLanguage();
  const totalPages = Math.ceil(total / pageSize);
  const startRecord = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const endRecord = Math.min(current * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-white h-16 gap-4">
      {/* 左侧：记录信息 */}
      <div className="text-xs text-slate-600 font-medium min-w-[150px]">
        {total === 0 ? (
          <span>{t('pagination.showing')} 0 {t('pagination.records')}</span>
        ) : (
          <span>
            {t('pagination.showing')} {startRecord}-{endRecord} {t('pagination.to')} / {t('pagination.of')} {total} {t('pagination.records')}
          </span>
        )}
      </div>

      {/* 中间：页码跳转 */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(1)}
          disabled={current === 1 || loading || total === 0}
          title="首页"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1 || loading || total === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 px-2">
          <span className="text-xs text-slate-600 font-medium">
            {total === 0 ? "0 / 0" : `${current} / ${totalPages}`}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(current + 1)}
          disabled={current === totalPages || loading || total === 0}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(totalPages)}
          disabled={current === totalPages || loading || total === 0}
          title="末页"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 右侧：每页行数选择 */}
      <div className="ml-auto">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
          disabled={loading}
        >
          <SelectTrigger className="w-[110px] h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 {t('pagination.to')}/页</SelectItem>
            <SelectItem value="20">20 {t('pagination.to')}/页</SelectItem>
            <SelectItem value="50">50 {t('pagination.to')}/页</SelectItem>
            <SelectItem value="100">100 {t('pagination.to')}/页</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
