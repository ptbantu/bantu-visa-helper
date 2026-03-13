#!/bin/bash

echo "🧪 开始测试 API 端点..."
echo ""

# 基础 URL
BASE_URL="http://localhost:8081"

# 测试 1: 获取签证列表
echo "📋 测试 1: GET /api/visas"
curl -s "$BASE_URL/api/visas" | jq '.' | head -20
echo ""
echo "---"
echo ""

# 测试 2: 获取日志
echo "📋 测试 2: GET /api/logs"
curl -s "$BASE_URL/api/logs?limit=5" | jq '.' | head -20
echo ""
echo "---"
echo ""

# 测试 3: 获取日志统计
echo "📋 测试 3: GET /api/logs/stats"
curl -s "$BASE_URL/api/logs/stats" | jq '.'
echo ""
echo "---"
echo ""

# 测试 4: 获取设置
echo "📋 测试 4: GET /api/settings"
curl -s "$BASE_URL/api/settings" | jq '.'
echo ""
echo "---"
echo ""

# 测试 5: 获取提醒
echo "📋 测试 5: GET /api/reminders"
curl -s "$BASE_URL/api/reminders" | jq '.' | head -30
echo ""
echo "---"
echo ""

# 测试 6: 创建日志
echo "📋 测试 6: POST /api/logs"
curl -s -X POST "$BASE_URL/api/logs" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "info",
    "module": "Test",
    "message": "这是一条测试日志"
  }' | jq '.'
echo ""
echo "---"
echo ""

# 测试 7: 测试邮箱连接
echo "📋 测试 7: POST /api/settings/test-email"
curl -s -X POST "$BASE_URL/api/settings/test-email" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "test@example.com",
    "password": "testpassword"
  }' | jq '.'
echo ""
echo "---"
echo ""

echo "✅ API 测试完成！"
