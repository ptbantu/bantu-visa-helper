import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { VisaRecord } from "@/src/types/api";

interface EditContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: VisaRecord | null;
  onSave: (passportNo: string, phone: string, whatsapp: string) => void;
}

export function EditContactDialog({ isOpen, onClose, record, onSave }: EditContactDialogProps) {
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    if (record) {
      setPhone(record.phone || "");
      setWhatsapp(record.whatsapp || "");
    }
  }, [record]);

  const handleSave = () => {
    if (record) {
      onSave(record.passport_no, phone, whatsapp);
      onClose();
    }
  };

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑联系方式</DialogTitle>
          <DialogDescription>
            为 {record.customer_name} ({record.passport_no}) 配置语音提醒联系方式。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="phone" className="text-right text-sm font-medium text-slate-700">
              电话
            </label>
            <Input
              id="phone"
              placeholder="+86 / +62"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="col-span-3 font-mono"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="whatsapp" className="text-right text-sm font-medium text-slate-700">
              WhatsApp
            </label>
            <Input
              id="whatsapp"
              placeholder="+62"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="col-span-3 font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
