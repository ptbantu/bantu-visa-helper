#!/bin/bash

echo "🗄️  初始化数据库..."
echo ""

# 检查 DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ 错误: DATABASE_URL 环境变量未设置"
  exit 1
fi

echo "✓ DATABASE_URL 已配置"
echo ""

# 生成 Prisma 客户端
echo "📦 生成 Prisma 客户端..."
npx prisma generate
echo ""

# 推送 schema 到数据库
echo "🔄 推送 schema 到数据库..."
npx prisma db push --skip-generate
echo ""

echo "✅ 数据库初始化完成！"
echo ""
echo "📝 后续步骤："
echo "1. 启动开发服务器: npm run dev"
echo "2. 访问应用: http://localhost:8081"
echo "3. 运行 API 测试: bash scripts/test-api.sh"
