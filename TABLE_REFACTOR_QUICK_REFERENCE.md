# 表格重构快速参考卡片

## 🎯 核心改动清单

### 表格样式
```tsx
// TableHead
className="py-1.5 px-3 text-[13px] font-semibold text-slate-700 bg-slate-100"

// TableCell
className="py-1.5 px-3 text-[13px]"

// TableRow
className={`border-b border-slate-200 hover:bg-slate-50 ${
  idx % 2 === 1 ? 'bg-slate-50/40' : ''
}`}
```

### 容器结构
```tsx
<div className="flex flex-col h-full">
  {/* 表格 */}
  <div className="flex-1 overflow-auto max-h-[calc(100vh-300px)]">
    <Table>
      <TableHeader className="bg-slate-100 sticky top-0 z-10 shadow-sm">
        {/* 表头 */}
      </TableHeader>
      <TableBody>
        {/* 表体 */}
      </TableBody>
    </Table>
  </div>

  {/* 分页条 */}
  <PaginationBar {...props} />
</div>
```

### 分页状态
```tsx
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
const [totalRecords, setTotalRecords] = useState(0);
const [isLoading, setIsLoading] = useState(false);
```

### API 调用
```tsx
useEffect(() => {
  const offset = (currentPage - 1) * pageSize;
  fetchData({ limit: pageSize, offset });
}, [currentPage, pageSize]);
```

## 📊 后端 API 优化

### 列表页 - 只加载必要字段
```typescript
const records = await prisma.model.findMany({
  select: {
    id: true,
    field1: true,
    field2: true,
    // ❌ 不加载：extractedData、file_url 等大字段
  },
  take: limit,
  skip: offset,
});
```

### 详情页 - 加载完整数据
```typescript
const record = await prisma.model.findUnique({
  where: { id },
  include: { /* 所有关联数据 */ },
});
```

## 🔍 需要修改的文件

| 文件 | 修改内容 |
|------|---------|
| app/kitas/page.tsx | 表格样式 + 分页 + API 优化 |
| app/logs/page.tsx | 表格样式 + 分页 + API 优化 |
| app/reminders/page.tsx | 表格样式 + 分页 + API 优化 |
| app/api/visas/route.ts | 使用 select 优化查询 |
| app/api/email-process-logs/route.ts | 使用 select 优化查询 |
| app/api/reminders/route.ts | 使用 select 优化查询 |

## ✅ 验收标准

- [ ] 表格行高度 ≤ 32px（py-1.5 + text-[13px]）
- [ ] 表头固定，滚动时不移动
- [ ] 分页条显示正确的记录范围
- [ ] 每页行数可切换（10/20/50/100）
- [ ] 加载时间 < 500ms（20 条记录）
- [ ] 分页切换时间 < 300ms
- [ ] 移动端响应式正常
- [ ] 现有功能（搜索、过滤、详情弹窗）保持不变

## 🚀 实现顺序

1. **Kitas.tsx** - 示范重构
2. **SystemLogs.tsx** - 应用相同模式
3. **Reminders.tsx** - 应用相同模式
4. **后端 API** - 优化查询

## 📝 提示词位置

完整的 Cursor AI 提示词：`CURSOR_TABLE_REFACTOR_PROMPT.md`

详细的重构指南：`TABLE_REFACTOR_GUIDE.md`

## 🎨 配色方案

| 元素 | 颜色 |
|------|------|
| 表头背景 | bg-slate-100 |
| 表头文字 | text-slate-700 |
| 行边框 | border-slate-200 |
| 偶数行背景 | bg-slate-50/40 |
| 行悬停 | hover:bg-slate-50 |
| 按钮禁用 | disabled:opacity-50 |

## 💡 常见问题

**Q: 为什么要用 select 优化查询？**
A: 减少网络传输，提高加载速度。extractedData 等大字段只在详情页加载。

**Q: sticky 表头在移动端工作吗？**
A: 是的，但需要测试。如果有问题，可以在移动端禁用 sticky。

**Q: 分页条的高度是多少？**
A: h-16（64px），包括上下 padding 和 border。

**Q: 如何处理无数据的情况？**
A: PaginationBar 会自动显示"无数据"，所有按钮禁用。
