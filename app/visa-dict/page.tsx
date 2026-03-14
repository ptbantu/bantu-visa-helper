"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/src/contexts/LanguageContext";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { Separator } from "@/src/components/ui/separator";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import { PaginationBar } from "@/src/components/PaginationBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Trash2, Edit, Plus } from "lucide-react";

interface VisaType {
  id: string;
  code: string;
  nameZh: string;
  nameId: string;
  requiresEntry: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function VisaDictPage() {
  const { t } = useLanguage();
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    nameZh: "",
    nameId: "",
    requiresEntry: false,
    isActive: true,
  });

  // 获取签证类型列表
  useEffect(() => {
    fetchVisaTypes();
  }, [currentPage, pageSize]);

  const fetchVisaTypes = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const res = await fetch(`/api/visa-types?limit=${pageSize}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        setVisaTypes(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("获取签证类型失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (visaType?: VisaType) => {
    if (visaType) {
      setEditingId(visaType.id);
      setFormData({
        code: visaType.code,
        nameZh: visaType.nameZh,
        nameId: visaType.nameId,
        requiresEntry: visaType.requiresEntry,
        isActive: visaType.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        code: "",
        nameZh: "",
        nameId: "",
        requiresEntry: false,
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.code || !formData.nameZh || !formData.nameId) {
        alert(t("visa_dict.error"));
        return;
      }

      if (editingId) {
        // 更新
        const res = await fetch(`/api/visa-types/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          alert(t("visa_dict.edit_success"));
          setIsDialogOpen(false);
          fetchVisaTypes();
        } else {
          alert(t("visa_dict.error"));
        }
      } else {
        // 创建
        const res = await fetch("/api/visa-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          alert(t("visa_dict.add_success"));
          setIsDialogOpen(false);
          setCurrentPage(1);
          fetchVisaTypes();
        } else {
          alert(t("visa_dict.error"));
        }
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert(t("visa_dict.error"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("visa_dict.delete_confirm"))) return;

    try {
      const res = await fetch(`/api/visa-types/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert(t("visa_dict.delete_success"));
        fetchVisaTypes();
      } else {
        const data = await res.json();
        alert(data.error || t("visa_dict.error"));
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert(t("visa_dict.error"));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 md:px-6 shadow-sm">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold text-slate-900">{t("visa_dict.title")}</h1>
        <div className="ml-auto">
          <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            {t("visa_dict.add")}
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">{t("visa_dict.code")}</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">{t("visa_dict.name_zh")}</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">{t("visa_dict.name_id")}</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">{t("visa_dict.requires_entry")}</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">{t("visa_dict.is_active")}</TableHead>
                  <TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">{t("visa_dict.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visaTypes.length > 0 ? (
                  visaTypes.map((visaType, idx) => (
                    <TableRow
                      key={visaType.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 ${
                        idx % 2 === 1 ? "bg-slate-50/40" : ""
                      }`}
                    >
                      <TableCell className="py-1.5 px-3 text-[13px] font-mono">{visaType.code}</TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px]">{visaType.nameZh}</TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px]">{visaType.nameId}</TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px]">
                        <Badge variant={visaType.requiresEntry ? "default" : "secondary"}>
                          {visaType.requiresEntry ? "是" : "否"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px]">
                        <Badge variant={visaType.isActive ? "default" : "destructive"}>
                          {visaType.isActive ? "启用" : "禁用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 px-3 text-[13px] flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(visaType)}
                          className="h-7 text-xs"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(visaType.id)}
                          className="h-7 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                      无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <PaginationBar
            current={currentPage}
            total={total}
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

      {/* 编辑/添加对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("visa_dict.edit") : t("visa_dict.add")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("visa_dict.code")}</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                disabled={!!editingId}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t("visa_dict.name_zh")}</label>
              <Input
                value={formData.nameZh}
                onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t("visa_dict.name_id")}</label>
              <Input
                value={formData.nameId}
                onChange={(e) => setFormData({ ...formData, nameId: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.requiresEntry}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresEntry: checked as boolean })
                }
              />
              <label className="text-sm font-medium">{t("visa_dict.requires_entry")}</label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <label className="text-sm font-medium">{t("visa_dict.is_active")}</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("visa_dict.cancel")}
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {t("visa_dict.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
