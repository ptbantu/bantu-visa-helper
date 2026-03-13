# 表格页面高密度紧凑模式重构 - Cursor AI 提示词

## Role
你是一位精通企业级后台 UI 设计（类似于 Ant Design 或 SAP）的前端工程师。

## Context
我们的系统由于涉及数千条护照数据，需要将所有表格页面重构为"高密度紧凑模式"。系统已经有以下基础设施：
- PaginationBar 组件已创建（src/components/PaginationBar.tsx）
- 表格重构指南已编写（TABLE_REFACTOR_GUIDE.md）
- 测试数据已准备（30 条邮件日志 + 30 条签证记录）

## Task

### 核心修改要求

#### 1. 统一表格紧凑化

修改所有表格页面中的表格样式：

- 将所有 TableCell 和 TableHead 的 py (垂直内边距) 设为 py-1.5
- 字体大小统一设为 text-[13px]
- 行高设为紧凑（leading-tight）
- 应用 Zebra Stripes（偶数行添加 bg-slate-50/40）

示例：
```tsx
<TableHead className="py-1.5 px-3 text-[13px] font-semibold text-slate-700">
  列名
</TableHead>

<TableCell className="py-1.5 px-3 text-[13px]">
  内容
</TableCell>

<TableRow className={`border-b border-slate-200 hover:bg-slate-50 ${
  idx % 2 === 1 ? 'bg-slate-50/40' : ''
}`}>
  {/* 行内容 */}
</TableRow>
```

#### 2. 实现固定表头和滚动容器

- 为表格容器添加 max-h-[calc(100vh-300px)] 和 overflow-auto
- 确保 thead 具有 sticky top-0 z-10 属性和 bg-slate-100 背景色
- 添加 shadow-sm 防止滚动时遮挡

示例：
```tsx
<div className="flex flex-col h-full">
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

#### 3. 集成 PaginationBar 组件

- 导入 PaginationBar 组件
- 添加分页状态管理（currentPage、pageSize）
- 更新 API 调用时传递 limit 和 offset 参数
- 处理分页变化时的数据重新加载

示例：
```tsx
import { PaginationBar } from "@/src/components/PaginationBar";

const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(20);

useEffect(() => {
  const offset = (currentPage - 1) * pageSize;
  fetchData({ limit: pageSize, offset });
}, [currentPage, pageSize]);

// 在表格下方
<PaginationBar
  current={currentPage}
  total={totalRecords}
  pageSize={pageSize}
  onPageChange={setCurrentPage}
  onPageSizeChange={(size) => {
    setPageSize(size);
    setCurrentPage(1); // 重置到第一页
  }}
  loading={isLoading}
/>
```

#### 4. 视觉降噪

- 移除不必要的边框，仅保留行底部的浅灰色细线（border-b border-slate-200）
- 使用 hover:bg-slate-50 提供交互反馈
- 移除过多的阴影和装饰

#### 5. 后端 API 优化

对于列表页 API，使用 select 只加载必要字段，不加载大的 JSON 字段（如 extractedData）：

```typescript
// 列表页 - 不加载大字段
const records = await prisma.model.findMany({
  select: {
    id: true,
    field1: true,
    field2: true,
    // 不加载：extractedData、file_url 等大字段
  },
  take: limit,
  skip: offset,
});

// 详情页 - 加载完整数据
const record = await prisma.model.findUnique({
  where: { id },
  include: { /* 所有关联数据 */ },
});
```

### 实现顺序

1. **第一步：Kitas.tsx 示范重构**
   - 修改表格样式为紧凑模式
   - 添加固定表头和滚动容器
   - 集成 PaginationBar 组件
   - 更新 API 调用

2. **第二步：SystemLogs.tsx 重构**
   - 应用相同的紧凑模式
   - 集成 PaginationBar
   - 更新 API 调用

3. **第三步：Reminders.tsx 重构**
   - 应用相同的紧凑模式
   - 集成 PaginationBar
   - 更新 API 调用

4. **第四步：后端 API 优化**
   - 更新所有列表 API 端点
   - 验证数据库索引
   - 性能测试

### 需要修改的文件

**前端页面：**
- app/kitas/page.tsx
- app/logs/page.tsx
- app/reminders/page.tsx

**后端 API：**
- app/api/visas/route.ts
- app/api/email-process-logs/route.ts
- app/api/reminders/route.ts

**数据库：**
- prisma/schema.prisma（验证索引）

## Vibe Check

页面要看起来像专业的金融或物流后台，信息密度极大但条理清晰。

关键指标：
- 表格加载时间：< 500ms
- 分页切换时间：< 300ms
- 内存占用：< 50MB（1000 条记录）
- 网络传输：< 100KB（20 条记录）

## 测试数据

系统已准备好以下测试数据：
- 30 条邮件处理日志（EmailProcessLog）
- 30 条签证记录（VisaRecord）
- 8 个客户记录（Customer）

可以使用这些数据进行分页和性能测试。

## 注意事项

1. 确保 sticky 表头在所有浏览器中正常工作
2. 测试大数据量下的性能（1000+ 条记录）
3. 验证分页逻辑的正确性
4. 检查移动端的响应式表现
5. 保持现有的交互功能（搜索、过滤、排序等）
6. 不要破坏现有的点击详情弹窗功能

## 参考资源

- 表格重构指南：TABLE_REFACTOR_GUIDE.md
- PaginationBar 组件：src/components/PaginationBar.tsx
- 现有表格实现：app/kitas/page.tsx（作为参考）

---

**开始重构时，请先从 Kitas.tsx 开始，作为其他页面的示范。**
