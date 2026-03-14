"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { Separator } from "@/src/components/ui/separator";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { PaginationBar } from "@/src/components/PaginationBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface Reminder {
  id: string;
  customer_name: string;
  passport_no: string;
  visa_type: string;
  expiry_date: string;
  days_left: number;
  stage: string;
  status: string;
  is_acknowledged: boolean;
}

export default function RemindersPage() {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState({ stage1_count: 0, stage2_count: 0, stage3_count: 0, unacknowledged_count: 0 });
  const [stageFilter, setStageFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * pageSize;
        const res = await fetch(`/api/reminders?stage=${stageFilter}&limit=${pageSize}&offset=${offset}`);
        if (res.ok) {
          const data = await res.json();
          setReminders(data.reminders.map((r: any) => ({
            ...r,
            expiry_date: new Date(r.expiry_date).toLocaleDateString('zh-CN'),
          })));
          setStats(data.stats);
          setTotalRecords(data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching reminders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stageFilter, currentPage, pageSize]);

  const handleTrigger = async () => {
    try {
      const res = await fetch('/api/reminders', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        alert(`已生成 ${result.created} 条新提醒，更新 ${result.updated} 条现有提醒`);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error triggering reminders:', error);
      alert('触发失败');
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_acknowledged: true }),
      });
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error acknowledging reminder:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === '紧急预警') return 'destructive';
    if (status === '电话提醒') return 'secondary';
    return 'default';
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 md:px-6 shadow-sm">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold text-slate-900">{t('nav.reminders')}</h1>
      </header>

      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-hidden flex flex-col">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
          <Card className="p-4">
            <p className="text-sm text-slate-500">阶段一 (5天)</p>
            <p className="text-2xl font-bold">{stats.stage1_count}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">阶段二 (3天)</p>
            <p className="text-2xl font-bold">{stats.stage2_count}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">阶段三 (1天)</p>
            <p className="text-2xl font-bold text-red-600">{stats.stage3_count}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">未确认</p>
            <p className="text-2xl font-bold">{stats.unacknowledged_count}</p>
          </Card>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <Button onClick={handleTrigger} className="bg-blue-600 hover:bg-blue-700">
            手动刷新提醒
          </Button>
          <Button
            variant={stageFilter === "all" ? "default" : "outline"}
            onClick={() => setStageFilter("all")}
          >
            全部
          </Button>
          <Button
            variant={stageFilter === "阶段一" ? "default" : "outline"}
            onClick={() => setStageFilter("阶段一")}
          >
            阶段一
          </Button>
          <Button
            variant={stageFilter === "阶段二" ? "default" : "outline"}
            onClick={() => setStageFilter("阶段二")}
          >
            阶段二
          </Button>
          <Button
            variant={stageFilter === "阶段三" ? "default" : "outline"}
            onClick={() => setStageFilter("阶段三")}
          >
            阶段三
          </Button>
        </div>

        {/* 提醒列表表格 */}
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">客户姓名</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">护照号</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">签证类型</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">到期日</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">剩余天数</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">阶段</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">状态</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.length > 0 ? (
                  reminders.map((r, idx) => (
                    <TableRow
                      key={r.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : ''
                      }`}
                    >
                      <TableCell className="py-1.5 px-3 text-[13px] font-medium">{r.customer_name}</TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px] font-mono text-slate-600">{r.passport_no}</TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px]">{r.visa_type}</TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px]">{r.expiry_date}</TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px]">
                        <Badge variant={r.days_left <= 1 ? 'destructive' : 'secondary'}>
                          {r.days_left} 天
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px]">
                        <Badge variant="outline">{r.stage}</Badge>
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px]">
                        <Badge variant={getStatusBadgeVariant(r.status)}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px]" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(r.id)}
                          className="text-xs h-7"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          已确认
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-slate-400 py-1.5 px-3 text-[13px]">
                      {loading ? '加载中...' : '暂无提醒'}
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
    </div>
  );
}
