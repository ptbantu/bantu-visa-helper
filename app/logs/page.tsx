"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { PaginationBar } from "@/src/components/PaginationBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Search,
  Filter,
  Download,
  Mail,
  FileSearch,
  Bell,
  AlertTriangle,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { StatusBadge, truncateKey, extractVisaInfo } from "@/src/components/EmailProcessLogComponents";

interface EmailProcessLog {
  id: string;
  messageId: string;
  pdfKey: string;
  pdfFilename: string;
  status: string;
  extractedData: any;
  errorMessage?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total_emails: number;
  success_count: number;
  pending_count: number;
  failed_count: number;
}

export default function Logs() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<EmailProcessLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_emails: 0,
    success_count: 0,
    pending_count: 0,
    failed_count: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<EmailProcessLog | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const statusParam = statusFilter === "all" ? "" : `&status=${statusFilter}`;
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        const offset = (currentPage - 1) * pageSize;

        const [logsRes, statsRes] = await Promise.all([
          fetch(`/api/email-process-logs?limit=${pageSize}&offset=${offset}${statusParam}${searchParam}`),
          fetch("/api/email-process-logs/stats"),
        ]);

        if (logsRes.ok) {
          const data = await logsRes.json();
          setLogs(
            data.data.map((log: any) => ({
              ...log,
              createdAt: new Date(log.createdAt).toLocaleString("zh-CN"),
              processedAt: log.processedAt ? new Date(log.processedAt).toLocaleString("zh-CN") : null,
            }))
          );
          setTotalRecords(data.total || 0);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [statusFilter, searchQuery, currentPage, pageSize]);

  const handleCopyJson = () => {
    if (selectedLog?.extractedData) {
      const jsonText = JSON.stringify(selectedLog.extractedData, null, 2);

      // 尝试使用 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jsonText).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          // 降级方案：使用传统的 execCommand
          fallbackCopyToClipboard(jsonText);
        });
      } else {
        // 降级方案：使用传统的 execCommand
        fallbackCopyToClipboard(jsonText);
      }
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  const visaInfo = selectedLog ? extractVisaInfo(selectedLog.extractedData) : {};

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 md:px-6 shadow-sm">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold text-slate-900">{t("nav.logs")}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Download className="w-4 h-4 mr-2" />
            导出日志
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-hidden flex flex-col">
        {/* 邮件解析概览 Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
          <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 rounded-full">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">已处理邮件总数</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.total_emails} <span className="text-sm font-normal text-slate-400">封</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-50 rounded-full">
              <FileSearch className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">PDF 识别成功数</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.success_count} <span className="text-sm font-normal text-slate-400">份</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-amber-50 rounded-full">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">正在处理中</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.pending_count} <span className="text-sm font-normal text-slate-400">份</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-red-50 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">识别失败数</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.failed_count} <span className="text-sm font-normal text-slate-400">份</span>
              </p>
            </div>
          </div>
        </div>

        {/* 过滤和搜索 */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg border shadow-sm flex-shrink-0">
          <div className="flex flex-1 w-full md:w-auto items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索客户姓名或护照号..."
                className="pl-8 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-slate-50">
                <Filter className="w-3 h-3 mr-2 text-slate-500" />
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="SUCCESS">解析成功</SelectItem>
                <SelectItem value="PENDING">正在处理</SelectItem>
                <SelectItem value="FAILED">解析失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            最后更新: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* 邮件解析流水表格 */}
        <div className="w-full max-w-full rounded-lg border bg-white shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="px-4 py-3 border-b bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              邮件解析流水 (Email Analysis Stream)
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              LIVE STREAMING
            </Badge>
          </div>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700 min-w-[140px]">时间</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700 min-w-[120px]">文件 Key</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700 min-w-[100px]">状态</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700 min-w-[150px]">识别结果</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700 flex-1">错误信息</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length > 0 ? (
                  logs.map((log, idx) => {
                    const info = extractVisaInfo(log.extractedData);
                    return (
                      <TableRow
                        key={log.id}
                        className={`border-b border-slate-200 hover:bg-slate-50 cursor-pointer ${
                          idx % 2 === 1 ? 'bg-slate-50/40' : ''
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell className="py-1.5 px-3 text-[13px] font-mono text-slate-500 whitespace-nowrap min-w-[140px]">
                          {log.processedAt || log.createdAt}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-[13px] font-mono text-slate-600 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <span title={log.pdfKey}>{truncateKey(log.pdfKey, 25)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-[13px] min-w-[100px]">
                          <StatusBadge status={log.status} error={log.errorMessage} />
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-[13px] text-slate-700 min-w-[150px]">
                          {info.name ? (
                            <div className="space-y-1">
                              <div className="font-medium">{info.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{info.passport}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 px-3 text-[13px] text-slate-600 flex-1">
                          {log.errorMessage ? (
                            <span className="text-red-600 text-xs line-clamp-2">{log.errorMessage}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic py-1.5 px-3 text-[13px]">
                      {loading ? "加载中..." : "没有找到符合条件的处理记录"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationBar
            current={currentPage}
            total={totalRecords}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            loading={loading}
          />
        </div>
      </main>

      {/* 详情弹窗 */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>邮件处理详情</DialogTitle>
            <DialogDescription>
              查看 PDF 识别的完整原始数据和处理状态
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">基本信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs mb-1">邮件 ID</p>
                    <p className="font-mono text-slate-900 break-all">{selectedLog.messageId}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">文件名</p>
                    <p className="text-slate-900">{selectedLog.pdfFilename}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">处理状态</p>
                    <StatusBadge status={selectedLog.status} error={selectedLog.errorMessage} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">处理时间</p>
                    <p className="text-slate-900">{selectedLog.processedAt || selectedLog.createdAt}</p>
                  </div>
                </div>
              </div>

              {/* 错误信息 */}
              {selectedLog.errorMessage && (
                <div className="space-y-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 text-sm">错误信息</h3>
                  <p className="text-red-700 text-sm">{selectedLog.errorMessage}</p>
                </div>
              )}

              {/* 提取的数据 */}
              {selectedLog.extractedData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">提取的数据</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyJson}
                      className="h-7 text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          {t('drawer.copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          {t('logs.copy_json')}
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                    {JSON.stringify(selectedLog.extractedData, null, 2)}
                  </pre>
                </div>
              )}

              {/* OSS 路径 */}
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 text-sm">OSS 存储路径</h3>
                <p className="font-mono text-xs text-slate-600 break-all">{selectedLog.pdfKey}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
