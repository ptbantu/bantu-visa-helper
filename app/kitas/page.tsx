"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, Copy, Check, AlertCircle, Clock, FileText, User, Calendar, Edit, FileDown, BellRing, BellOff } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { useLanguage } from "@/src/contexts/LanguageContext";

import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Sheet } from "@/src/components/ui/sheet";
import { Separator } from "@/src/components/ui/separator";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { mockVisaData } from "@/src/data/mock";
import { VisaRecord } from "@/src/types/api";
import { KitasWorkflow } from "@/src/components/KitasWorkflow";
import { EditContactDialog } from "@/src/components/EditContactDialog";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { getVisaIcon } from "@/app/page";

function KitasContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  // Local state to simulate DB updates
  const [data, setData] = useState<VisaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<VisaRecord | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchVisas = async () => {
      try {
        const response = await fetch('/api/visas?type=kitas');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch visas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVisas();
  }, []);

  const passportIdFromUrl = searchParams.get("passport_id");

  // If there's a passport_id in URL, find the selected record
  const selectedRecord = useMemo(() => {
    return data.find((r) => r.passport_no === passportIdFromUrl) || null;
  }, [passportIdFromUrl, data]);

  // Filter data based on search query (name or passport_no)
  const filteredData = useMemo(() => {
    // Only show ITAS/Work visas
    let filtered = data.filter(
      (r) => r.visaType?.code?.includes("ITAS") ||
             r.visaType?.code?.includes("C31") ||
             r.visaType?.code?.includes("C312") ||
             r.visaType?.code?.includes("C313") ||
             r.visaType?.code?.includes("C314")
    );

    // If there's a global search query, filter by it
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.customer?.name?.toLowerCase().includes(lowerQuery) ||
          record.passport_no.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      const today = new Date();
      filtered = filtered.filter((record) => {
        const daysLeft = differenceInDays(parseISO(record.expiry_date), today);
        if (statusFilter === "expired") return daysLeft < 0;
        if (statusFilter === "expiring_soon") return daysLeft >= 0 && daysLeft <= 30;
        if (statusFilter === "valid") return daysLeft > 30;
        return true;
      });
    }

    // If there's a passport_id in URL, filter to show ONLY that record
    if (passportIdFromUrl) {
      filtered = filtered.filter((record) => record.passport_no === passportIdFromUrl);
    }

    return filtered;
  }, [searchQuery, statusFilter, passportIdFromUrl, data]);

  const handleRowClick = (passportNo: string) => {
    router.push(`${pathname}?passport_id=${passportNo}`);
  };

  const handleCloseSheet = () => {
    router.push(pathname);
    setCopied(false);
  };

  const handleCopyLink = () => {
    if (selectedRecord) {
      const url = new URL(window.location.href);
      url.searchParams.set("passport_id", selectedRecord.passport_no);
      navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveContact = async (passportNo: string, phone: string, whatsapp: string) => {
    try {
      const response = await fetch(`/api/visas/${passportNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, whatsapp }),
      });
      if (response.ok) {
        setData((prev) =>
          prev.map((r) =>
            r.passport_no === passportNo ? { ...r, phone, whatsapp } : r
          )
        );
      }
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  const getStatusBadge = (expiryDate: string, isUrgent: boolean) => {
    const daysLeft = differenceInDays(parseISO(expiryDate), new Date());

    if (daysLeft < 0) {
      return <Badge variant="destructive">已过期</Badge>;
    }
    if (daysLeft <= 30) {
      return <Badge variant="destructive">即将过期 ({daysLeft}天)</Badge>;
    }
    if (isUrgent) {
      return <Badge variant="warning">加急处理</Badge>;
    }
    return <Badge variant="secondary">正常</Badge>;
  };

  const toggleSelectAll = () => {
    if (selectedRecords.size === filteredData.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(filteredData.map(r => r.passport_no)));
    }
  };

  const toggleSelectRecord = (passportNo: string) => {
    const newSet = new Set(selectedRecords);
    if (newSet.has(passportNo)) {
      newSet.delete(passportNo);
    } else {
      newSet.add(passportNo);
    }
    setSelectedRecords(newSet);
  };

  const handleBulkDownload = () => {
    alert(`已开始下载 ${selectedRecords.size} 份文件`);
    setSelectedRecords(new Set());
  };

  const handleBulkEnableReminders = async () => {
    try {
      const passportNos = Array.from(selectedRecords);
      const response = await fetch('/api/visas/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable_reminders', passport_nos: passportNos }),
      });
      if (response.ok) {
        setData(prev => prev.map(r => selectedRecords.has(r.passport_no) ? { ...r, reminder_enabled: true } : r));
        setSelectedRecords(new Set());
      }
    } catch (error) {
      console.error('Failed to enable reminders:', error);
    }
  };

  const handleBulkDisableReminders = async () => {
    try {
      const passportNos = Array.from(selectedRecords);
      const response = await fetch('/api/visas/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable_reminders', passport_nos: passportNos }),
      });
      if (response.ok) {
        setData(prev => prev.map(r => selectedRecords.has(r.passport_no) ? { ...r, reminder_enabled: false } : r));
        setSelectedRecords(new Set());
      }
    } catch (error) {
      console.error('Failed to disable reminders:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 md:px-6 shadow-sm">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold text-slate-900">{t('page.kitas.title')}</h1>
        <div className="ml-auto flex w-full max-w-md items-center space-x-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="所有状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有状态</SelectItem>
              <SelectItem value="valid">正常</SelectItem>
              <SelectItem value="expiring_soon">即将过期</SelectItem>
              <SelectItem value="expired">已过期</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder={t('search.placeholder')}
              className="w-full bg-slate-100 pl-8 focus-visible:bg-white"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Clear URL param when searching globally to reset view
                if (passportIdFromUrl) {
                  router.push(pathname);
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        <div className="mx-auto max-w-full xl:max-w-7xl rounded-lg border bg-white shadow-sm overflow-hidden flex flex-col">
          {selectedRecords.size > 0 && (
            <div className="flex flex-wrap items-center justify-between bg-blue-50/50 px-4 py-2 border-b gap-2">
              <span className="text-sm text-blue-700 font-medium">
                已选择 {selectedRecords.size} 项
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 bg-white" onClick={handleBulkDownload}>
                  <FileDown className="mr-2 h-4 w-4" />
                  批量下载
                </Button>
                <Button size="sm" variant="outline" className="h-8 bg-white" onClick={handleBulkEnableReminders}>
                  <BellRing className="mr-2 h-4 w-4 text-green-600" />
                  开启提醒
                </Button>
                <Button size="sm" variant="outline" className="h-8 bg-white" onClick={handleBulkDisableReminders}>
                  <BellOff className="mr-2 h-4 w-4 text-slate-400" />
                  关闭提醒
                </Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[50px] text-center">
                  <Checkbox 
                    checked={filteredData.length > 0 && selectedRecords.size === filteredData.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[50px] text-center">{t('table.edit')}</TableHead>
                <TableHead className="w-auto whitespace-nowrap">{t('table.customer_name')}</TableHead>
                <TableHead>{t('table.passport_no')}</TableHead>
                <TableHead className="w-auto whitespace-nowrap">{t('table.visa_type')}</TableHead>
                <TableHead>{t('table.expiry_date')}</TableHead>
                <TableHead className="text-right">{t('table.days_left')}</TableHead>
                <TableHead className="text-center">{t('table.status')}</TableHead>
                <TableHead className="text-left w-[250px]">{t('table.download')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-slate-500">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((record) => {
                  const daysLeft = differenceInDays(parseISO(record.expiry_date), new Date());
                  const isExpiredOrSoon = daysLeft <= 30;
                  
                  return (
                    <TableRow
                      key={record.passport_no}
                      className={`cursor-pointer hover:bg-slate-50 ${selectedRecords.has(record.passport_no) ? "bg-blue-50/30" : ""}`}
                      onClick={() => handleRowClick(record.passport_no)}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedRecords.has(record.passport_no)}
                          onCheckedChange={() => toggleSelectRecord(record.passport_no)}
                          aria-label={`Select ${record.customer?.name}`}
                        />
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingRecord(record)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-slate-900 h-8 w-8 text-slate-500"
                          title="编辑联系方式"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{record.customer?.name}</TableCell>
                      <TableCell className="font-mono text-slate-600">{record.passport_no}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getVisaIcon(record.visaType?.nameZh || record.visaType?.code || '')}
                          <span>{record.visaType?.nameZh || record.visaType?.code || '未知'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{record.expiry_date}</TableCell>
                      <TableCell className="text-right">
                        <span className={isExpiredOrSoon ? "text-red-600 font-semibold" : "text-slate-600"}>
                          {daysLeft < 0 ? "过期" : `${daysLeft} 天`}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(record.expiry_date, record.is_urgent)}
                      </TableCell>
                      <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-blue-600 hover:underline text-slate-600 text-left"
                          title="下载签证文件"
                          onClick={(e) => {
                            e.stopPropagation();
                            const fileName = `${record.customer_name}${record.passport_no}${record.visa_type}.pdf`;
                            const blob = new Blob(['Mock PDF content for ' + fileName], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = fileName;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <FileDown className="h-4 w-4 shrink-0" />
                          <span className="truncate max-w-[200px]">{record.customer_name}{record.passport_no}{record.visa_type}.pdf</span>
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-slate-500">
                    未找到匹配的记录。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      </main>

      <EditContactDialog
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        onSave={handleSaveContact}
      />

      {/* Detail Sheet */}
      <Sheet
        isOpen={!!selectedRecord}
        onClose={handleCloseSheet}
        title="签证详情"
        description="AI 提取的结构化签证数据"
      >
        {selectedRecord && (
          <div className="mt-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              {getStatusBadge(selectedRecord.expiry_date, selectedRecord.is_urgent)}
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="h-8">
                {copied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "已复制" : "复制链接"}
              </Button>
            </div>

            <div className="space-y-4 rounded-md border p-4 bg-slate-50/50">
              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <User className="h-4 w-4" /> 姓名
                </div>
                <div className="col-span-2 text-sm font-semibold text-slate-900">
                  {selectedRecord.customer?.name}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> 护照号
                </div>
                <div className="col-span-2 text-sm font-mono text-slate-900">
                  {selectedRecord.passport_no}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> 签证类型
                </div>
                <div className="col-span-2 text-sm text-slate-900 flex items-center gap-2">
                  {getVisaIcon(selectedRecord.visaType?.nameZh || selectedRecord.visaType?.code || '')}
                  {selectedRecord.visaType?.nameZh || selectedRecord.visaType?.code || '未知'}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> 有效期至
                </div>
                <div className="col-span-2 text-sm text-slate-900">
                  {selectedRecord.expiry_date}
                </div>
              </div>

              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> 紧急程度
                </div>
                <div className="col-span-2 text-sm text-slate-900">
                  {selectedRecord.is_urgent ? "加急" : "普通"}
                </div>
              </div>
            </div>

            <KitasWorkflow record={selectedRecord} />

            <div className="mt-auto pt-6">
              <Button className="w-full" onClick={handleCloseSheet}>
                关闭
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

export default function Kitas() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <KitasContent />
    </Suspense>
  );
}
