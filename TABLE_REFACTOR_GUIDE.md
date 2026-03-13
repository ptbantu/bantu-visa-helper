# 表格页面高密度紧凑模式重构指南

## 概述

本指南用于将系统中所有表格页面（Kitas.tsx、SystemLogs.tsx、Reminders.tsx 等）重构为高密度紧凑模式，以支持数千条数据的高效展示。

## 核心修改要求

### 1. 统一表格紧凑化

#### 修改 src/components/ui/table.tsx

```tsx
// 添加紧凑模式的样式类
export const TableCompact = {
  Header: "py-1.5 px-3 text-[13px] font-semibold text-slate-700 bg-slate-100 border-b border-slate-200",
  Cell: "py-1.5 px-3 text-[13px] text-slate-900",
  Row: "border-b border-slate-200 hover:bg-slate-50 transition-colors",
  RowEven: "bg-slate-50/40",
};
```

#### 在业务页面中应用

```tsx
// 示例：Kitas.tsx
<Table>
  <TableHeader className="bg-slate-100 sticky top-0 z-10">
    <TableRow>
      <TableHead className="py-1.5 px-3 text-[13px] font-semibold">时间</TableHead>
      <TableHead className="py-1.5 px-3 text-[13px] font-semibold">文件 Key</TableHead>
      {/* ... */}
    </TableRow>
  </TableHeader>
  <TableBody>
    {logs.map((log, idx) => (
      <TableRow
        key={log.id}
        className={`border-b border-slate-200 hover:bg-slate-50 ${
          idx % 2 === 1 ? 'bg-slate-50/40' : ''
        }`}
      >
        <TableCell className="py-1.5 px-3 text-[13px]">{log.timestamp}</TableCell>
        {/* ... */}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 2. 实现固定表头和滚动容器

```tsx
<div className="flex flex-col h-full">
  {/* 表格容器 - 固定高度，可滚动 */}
  <div className="flex-1 overflow-auto max-h-[calc(100vh-300px)]">
    <Table>
      <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm">
        {/* 表头内容 */}
      </TableHeader>
      <TableBody>
        {/* 表体内容 */}
      </TableBody>
    </Table>
  </div>

  {/* 分页条 - 固定在底部 */}
  <PaginationBar
    current={currentPage}
    total={totalRecords}
    pageSize={pageSize}
    onPageChange={setCurrentPage}
    onPageSizeChange={setPageSize}
  />
</div>
```

### 3. 增强版分页条组件

创建 `src/components/PaginationBar.tsx`：

```tsx
import { Button } from "@/src/components/ui/button";
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
}

export function PaginationBar({
  current,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  const totalPages = Math.ceil(total / pageSize);
  const startRecord = (current - 1) * pageSize + 1;
  const endRecord = Math.min(current * pageSize, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-white h-16">
      {/* 左侧：记录信息 */}
      <div className="text-xs text-slate-600 font-medium">
        第 {startRecord}-{endRecord} 条 / 共 {total} 条记录
      </div>

      {/* 中间：页码跳转 */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(1)}
          disabled={current === 1}
          title="首页"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 px-2">
          <span className="text-xs text-slate-600">
            第 {current} / {totalPages} 页
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(current + 1)}
          disabled={current === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onPageChange(totalPages)}
          disabled={current === totalPages}
          title="末页"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 右侧：每页行数选择 */}
      <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
        <SelectTrigger className="w-[100px] h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 行/页</SelectItem>
          <SelectItem value="20">20 行/页</SelectItem>
          <SelectItem value="50">50 行/页</SelectItem>
          <SelectItem value="100">100 行/页</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

### 4. 视觉降噪

- 移除不必要的边框，仅保留行底部的浅灰色细线
- 偶数行添加极淡的背景色（Zebra Stripes）
- 使用 `hover:bg-slate-50` 提供交互反馈

## 后端 API 优化

### 1. 数据库索引优化

在 `prisma/schema.prisma` 中确保以下字段有索引：

```prisma
model VisaRecord {
  // ... 其他字段

  @@index([passport_no])
  @@index([expiry_date])
  @@index([customerId])
  @@index([visaTypeCode])
}

model EmailProcessLog {
  // ... 其他字段

  @@index([messageId])
  @@index([status])
  @@index([createdAt])
}
```

### 2. 按需加载 (Select Only Necessary Fields)

#### 列表页 API - 不加载大字段

```typescript
// app/api/visas/route.ts
export async function GET(request: Request) {
  const visas = await prisma.visaRecord.findMany({
    select: {
      id: true,
      passport_no: true,
      expiry_date: true,
      is_urgent: true,
      reminder_enabled: true,
      customer: {
        select: {
          name: true,
          passport_no: true,
        },
      },
      visaType: {
        select: {
          code: true,
          nameZh: true,
          nameId: true,
        },
      },
      // 注意：不加载 file_url 等大字段
    },
    orderBy: { expiry_date: 'asc' },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(visas);
}
```

#### 详情页 API - 加载完整数据

```typescript
// app/api/visas/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const visa = await prisma.visaRecord.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      visaType: true,
      // 这里可以加载所有字段
    },
  });

  return NextResponse.json(visa);
}
```

#### 邮件处理日志 API - 列表不加载 extractedData

```typescript
// app/api/email-process-logs/route.ts
export async function GET(request: Request) {
  const logs = await prisma.emailProcessLog.findMany({
    select: {
      id: true,
      messageId: true,
      pdfKey: true,
      pdfFilename: true,
      status: true,
      errorMessage: true,
      processedAt: true,
      createdAt: true,
      // 注意：不加载 extractedData
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(logs);
}
```

## 实现步骤

### 第一阶段：Kitas.tsx 示范重构

1. 修改表格样式为紧凑模式
2. 添加固定表头和滚动容器
3. 集成 PaginationBar 组件
4. 更新 API 调用，使用分页参数

### 第二阶段：其他页面重构

1. SystemLogs.tsx
2. Reminders.tsx
3. 其他表格页面

### 第三阶段：后端优化

1. 更新所有 API 端点，使用 select 优化查询
2. 验证数据库索引
3. 性能测试

## 性能指标

- 表格加载时间：< 500ms（20 条记录）
- 分页切换时间：< 300ms
- 内存占用：< 50MB（1000 条记录）
- 网络传输：< 100KB（20 条记录）

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 注意事项

1. 确保 sticky 表头在所有浏览器中正常工作
2. 测试大数据量下的性能（1000+ 条记录）
3. 验证分页逻辑的正确性
4. 检查移动端的响应式表现
