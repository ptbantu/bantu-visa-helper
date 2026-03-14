import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, MapPin, CalendarDays, AlertCircle } from "lucide-react";
import { differenceInDays, parseISO, addDays, format } from "date-fns";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { VisaRecord } from "@/src/types/api";

interface KitasWorkflowProps {
  record: VisaRecord;
}

const steps = [
  {
    id: 1,
    titleZh: "已入境",
    status: "completed",
  },
  {
    id: 2,
    titleZh: "材料准备",
    status: "in-progress",
  },
  {
    id: 3,
    titleZh: "递交移民局",
    status: "pending",
  },
  {
    id: 4,
    titleZh: "采集指纹",
    status: "pending",
  },
  {
    id: 5,
    titleZh: "正式签发",
    status: "pending",
  },
];

export function KitasWorkflow({ record }: KitasWorkflowProps) {
  // Only show if it's an ITAS visa
  if (!record.visaType?.code?.includes("ITAS")) {
    return null;
  }

  // Calculate days remaining for document prep (assuming 30 days from entry date)
  const entryDateStr = record.entry_date || format(new Date(), "yyyy-MM-dd");
  const entryDate = parseISO(entryDateStr);
  const deadlineDate = addDays(entryDate, 30);
  const daysRemaining = differenceInDays(deadlineDate, new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-6 flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            KITAS 办理流程
          </h3>
        </div>
        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
          {record.visaType?.code || "N/A"}
        </Badge>
      </div>

      <Separator />

      {/* KITAS Essential Info */}
      <div className="grid grid-cols-2 gap-4 rounded-md bg-slate-50 p-4 border border-slate-100">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            入境时间
          </span>
          <span className="text-sm font-semibold text-slate-900 font-mono">
            {record.entry_date || "N/A"}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            入境口岸
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {record.port_of_entry || "N/A"}
          </span>
        </div>
        <div className="col-span-2 flex items-center gap-2 mt-2 bg-white p-3 rounded border border-slate-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-700">
              首阶段材料准备剩余期限
            </span>
            <span className="text-sm font-bold text-amber-600">
              {daysRemaining > 0 ? `${daysRemaining} 天` : "已逾期"}
            </span>
          </div>
        </div>
      </div>

      {/* Bilingual Workflow Stepper */}
      <div className="relative pl-2 pt-2">
        {/* Vertical Line */}
        <div className="absolute left-[18px] top-4 bottom-4 w-px bg-slate-200" />

        <div className="flex flex-col gap-6">
          {steps.map((step, index) => {
            const isCompleted = step.status === "completed";
            const isInProgress = step.status === "in-progress";
            const isPending = step.status === "pending";

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="relative flex items-start gap-4"
              >
                <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center bg-white">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : isInProgress ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col pt-0.5">
                  <span
                    className={`text-sm font-semibold ${
                      isCompleted
                        ? "text-slate-900"
                        : isInProgress
                        ? "text-blue-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step.titleZh}
                  </span>
                </div>
                {isInProgress && (
                  <Badge
                    variant="secondary"
                    className="ml-auto mt-1 bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200"
                  >
                    进行中
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
